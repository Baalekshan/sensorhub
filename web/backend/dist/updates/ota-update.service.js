"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTAUpdateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const uuid_1 = require("uuid");
const firmware_entity_1 = require("../entities/firmware.entity");
const update_session_entity_1 = require("../entities/update-session.entity");
const device_communication_service_1 = require("../services/device-communication.service");
const messaging_types_1 = require("../types/messaging.types");
const update_types_1 = require("./update.types");
let OTAUpdateService = class OTAUpdateService {
    constructor(deviceCommunicationService, firmwareRepository, updateSessionRepository, eventEmitter) {
        this.deviceCommunicationService = deviceCommunicationService;
        this.firmwareRepository = firmwareRepository;
        this.updateSessionRepository = updateSessionRepository;
        this.eventEmitter = eventEmitter;
        this.DEFAULT_CHUNK_SIZE = 4096;
        this.eventEmitter.on('device.message', async (event) => {
            var _a;
            if (event.message.messageType === messaging_types_1.MessageType.DEVICE_STATUS) {
                if ((_a = event.message.payload) === null || _a === void 0 ? void 0 : _a.updateStatus) {
                    await this.processUpdateStatusReport(event.message.deviceId, event.message.payload.updateStatus);
                }
            }
        });
        this.eventEmitter.on('update.device.needed', async (data) => {
            this.eventEmitter.emit('device.info.requested', { deviceId: data.deviceId });
        });
    }
    async startFirmwareUpdate(deviceInfo, firmwareId, options = {}) {
        const firmware = await this.firmwareRepository.findOne({
            where: { id: firmwareId }
        });
        if (!firmware) {
            throw new Error(`Firmware ${firmwareId} not found`);
        }
        if (!this.isCompatible(deviceInfo, firmware)) {
            throw new Error('Firmware is not compatible with this device');
        }
        const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
        const totalChunks = Math.ceil(firmware.data.length / chunkSize);
        const session = this.updateSessionRepository.create({
            id: (0, uuid_1.v4)(),
            deviceId: deviceInfo.id,
            type: update_types_1.UpdateType.FIRMWARE,
            status: update_types_1.UpdateSessionState.INITIATED,
            sourceId: firmwareId,
            totalChunks,
            chunkSize,
            sentChunks: 0,
            acknowledgedChunks: 0,
            startedAt: new Date(),
            lastActivityAt: new Date(),
            expectedDuration: this.estimateUpdateDuration(deviceInfo, firmware.data.length, chunkSize),
            version: firmware.version,
            checksum: firmware.checksum,
            options: {
                forceUpdate: options.forceUpdate || false,
                skipVerification: options.skipVerification || false,
                updateTimeout: options.updateTimeout || 300000,
            }
        });
        await this.updateSessionRepository.save(session);
        this.eventEmitter.emit('update.initiated', {
            sessionId: session.id,
            deviceId: deviceInfo.id,
            type: update_types_1.UpdateType.FIRMWARE,
            version: firmware.version
        });
        this.startUpdateProcess(session);
        return session;
    }
    async startUpdateProcess(session) {
        try {
            await this.updateSessionStatus(session.id, update_types_1.UpdateSessionState.PREPARING);
            let totalSize = 0;
            if (session.type === update_types_1.UpdateType.FIRMWARE) {
                const firmware = await this.firmwareRepository.findOne({
                    where: { id: session.sourceId }
                });
                if (!firmware) {
                    throw new Error(`Firmware ${session.sourceId} not found`);
                }
                totalSize = firmware.data.length;
            }
            else {
                totalSize = 0;
            }
            const prepareResult = await this.deviceCommunicationService.sendMessageToDevice({
                deviceId: session.deviceId,
                messageType: messaging_types_1.MessageType.UPDATE_PREPARE,
                payload: {
                    updateId: session.id,
                    updateType: session.type,
                    version: session.version,
                    totalSize,
                    chunkSize: session.chunkSize,
                    totalChunks: session.totalChunks,
                    checksum: session.checksum,
                    forceUpdate: session.options.forceUpdate
                },
                messageId: `prepare_${session.id}`,
                priority: messaging_types_1.MessagePriority.HIGH,
                timestamp: Date.now(),
                ttl: 60000
            });
            if (!prepareResult.success && !prepareResult.pendingDelivery) {
                throw new Error('Failed to prepare device for update: ' + prepareResult.error);
            }
            const prepareTimeout = setTimeout(() => {
                this.handleUpdateError(session, new Error('Timeout waiting for device to prepare for update'));
            }, 60000);
            this.eventEmitter.once(`device.${session.deviceId}.update.ready`, () => {
                clearTimeout(prepareTimeout);
                this.continueWithTransfer(session);
            });
        }
        catch (error) {
            await this.handleUpdateError(session, error);
        }
    }
    async continueWithTransfer(session) {
        try {
            await this.updateSessionStatus(session.id, update_types_1.UpdateSessionState.TRANSFERRING);
            await this.sendNextChunk(session, 0);
        }
        catch (error) {
            await this.handleUpdateError(session, error);
        }
    }
    async sendNextChunk(session, chunkIndex) {
        if (chunkIndex >= session.totalChunks) {
            await this.finalizeUpdate(session);
            return;
        }
        try {
            const chunkData = await this.getChunkData(session.type, session.sourceId, chunkIndex, session.chunkSize);
            const chunkChecksum = this.calculateChecksum(chunkData);
            const sendResult = await this.deviceCommunicationService.sendMessageToDevice({
                deviceId: session.deviceId,
                messageType: messaging_types_1.MessageType.UPDATE_CHUNK,
                payload: {
                    updateId: session.id,
                    chunkIndex,
                    totalChunks: session.totalChunks,
                    data: chunkData.toString('base64'),
                    checksum: chunkChecksum
                },
                messageId: `chunk_${session.id}_${chunkIndex}`,
                priority: messaging_types_1.MessagePriority.HIGH,
                timestamp: Date.now(),
                ttl: 60000
            });
            if (!sendResult.success && !sendResult.pendingDelivery) {
                throw new Error(`Failed to send chunk ${chunkIndex}: ${sendResult.error}`);
            }
            await this.updateSessionProgress(session.id, {
                sentChunks: chunkIndex + 1,
                lastActivityAt: new Date()
            });
        }
        catch (error) {
            await this.handleUpdateError(session, error);
        }
    }
    async finalizeUpdate(session) {
        try {
            await this.updateSessionStatus(session.id, update_types_1.UpdateSessionState.VALIDATING);
            const finalizeResult = await this.deviceCommunicationService.sendMessageToDevice({
                deviceId: session.deviceId,
                messageType: messaging_types_1.MessageType.UPDATE_FINALIZE,
                payload: {
                    updateId: session.id,
                    checksum: session.checksum
                },
                messageId: `finalize_${session.id}`,
                priority: messaging_types_1.MessagePriority.HIGH,
                timestamp: Date.now(),
                ttl: 60000
            });
            if (!finalizeResult.success && !finalizeResult.pendingDelivery) {
                throw new Error(`Failed to finalize update: ${finalizeResult.error}`);
            }
        }
        catch (error) {
            await this.handleUpdateError(session, error);
        }
    }
    async processUpdateStatusReport(deviceId, statusReport) {
        const session = await this.updateSessionRepository.findOne({
            where: {
                deviceId,
                status: (0, typeorm_2.Not)((0, typeorm_2.In)([
                    update_types_1.UpdateSessionState.COMPLETED,
                    update_types_1.UpdateSessionState.FAILED,
                    update_types_1.UpdateSessionState.ROLLED_BACK,
                    update_types_1.UpdateSessionState.CRITICAL_FAILURE
                ]))
            },
            order: { startedAt: 'DESC' }
        });
        if (!session) {
            console.warn(`Received update status for device ${deviceId} with no active update session`);
            return;
        }
        switch (statusReport.status) {
            case 'READY':
                this.eventEmitter.emit(`device.${deviceId}.update.ready`, {
                    sessionId: session.id
                });
                break;
            case 'CHUNK_RECEIVED':
                await this.handleChunkReceived(session, statusReport);
                break;
            case 'VALIDATION_COMPLETE':
                await this.updateSessionStatus(session.id, update_types_1.UpdateSessionState.APPLYING);
                break;
            case 'UPDATE_APPLIED':
                await this.updateSessionStatus(session.id, update_types_1.UpdateSessionState.RESTARTING);
                break;
            case 'RESTART_COMPLETE':
                await this.updateSessionStatus(session.id, update_types_1.UpdateSessionState.VERIFYING);
                if (session.options.skipVerification) {
                    await this.completeUpdate(session);
                }
                else {
                    await this.verifyDeviceHealth(session);
                }
                break;
            case 'VERIFICATION_PASSED':
                await this.completeUpdate(session);
                break;
            case 'UPDATE_FAILED':
                await this.handleUpdateFailure(session, statusReport.error || 'Unknown error');
                break;
            case 'ROLLBACK_COMPLETE':
                await this.updateSessionStatus(session.id, update_types_1.UpdateSessionState.ROLLED_BACK);
                this.eventEmitter.emit('update.rolledback', {
                    sessionId: session.id,
                    deviceId,
                    reason: statusReport.message || 'Rollback completed'
                });
                break;
            default:
                console.warn(`Unknown update status report: ${statusReport.status}`);
        }
    }
    async handleChunkReceived(session, report) {
        await this.updateSessionProgress(session.id, {
            acknowledgedChunks: report.chunkId + 1,
            lastActivityAt: new Date()
        });
        this.eventEmitter.emit('update.progress', {
            sessionId: session.id,
            deviceId: session.deviceId,
            progress: (report.chunkId + 1) / session.totalChunks,
            chunkId: report.chunkId
        });
        const updatedSession = await this.updateSessionRepository.findOne({
            where: { id: session.id }
        });
        if (!updatedSession) {
            throw new Error(`Session ${session.id} not found`);
        }
        if (report.chunkId < updatedSession.totalChunks - 1) {
            await this.sendNextChunk(updatedSession, report.chunkId + 1);
        }
    }
    async completeUpdate(session) {
        await this.updateSessionStatus(session.id, update_types_1.UpdateSessionState.COMPLETED);
        this.eventEmitter.emit('update.completed', {
            sessionId: session.id,
            deviceId: session.deviceId,
            type: session.type,
            version: session.version,
            duration: Date.now() - session.startedAt.getTime(),
            shouldUpdateDeviceFirmware: session.type === update_types_1.UpdateType.FIRMWARE,
            newFirmwareVersion: session.type === update_types_1.UpdateType.FIRMWARE ? session.version : null
        });
    }
    async verifyDeviceHealth(session) {
        try {
            this.eventEmitter.emit('device.health.check.requested', {
                deviceId: session.deviceId,
                sessionId: session.id
            });
            const healthCheckTimeout = setTimeout(() => {
                this.handleUpdateVerificationFailure(session, new Error('Timeout waiting for device health check'));
            }, 60000);
            this.eventEmitter.once(`device.${session.deviceId}.health.check.completed`, (result) => {
                clearTimeout(healthCheckTimeout);
                if (result.healthy) {
                    this.completeUpdate(session);
                }
                else {
                    this.handleUpdateVerificationFailure(session, new Error(result.error || 'Device health check failed'));
                }
            });
        }
        catch (error) {
            await this.handleUpdateVerificationFailure(session, error);
        }
    }
    async handleUpdateVerificationFailure(session, error) {
        await this.updateSessionStatus(session.id, update_types_1.UpdateSessionState.ROLLING_BACK);
        console.error(`Update verification failed for session ${session.id}:`, error);
        this.eventEmitter.emit('update.verification.failed', {
            sessionId: session.id,
            deviceId: session.deviceId,
            error: error.message
        });
        await this.deviceCommunicationService.sendMessageToDevice({
            deviceId: session.deviceId,
            messageType: messaging_types_1.MessageType.UPDATE_ROLLBACK,
            payload: {
                updateId: session.id
            },
            messageId: `rollback_${session.id}`,
            priority: messaging_types_1.MessagePriority.CRITICAL,
            timestamp: Date.now(),
            ttl: 300000
        });
    }
    async handleUpdateFailure(session, error) {
        await this.updateSessionStatus(session.id, update_types_1.UpdateSessionState.FAILED);
        console.error(`Update failed for session ${session.id}:`, error);
        this.eventEmitter.emit('update.failed', {
            sessionId: session.id,
            deviceId: session.deviceId,
            error
        });
    }
    async handleUpdateError(session, error) {
        console.error(`Error in update session ${session.id}:`, error);
        await this.updateSessionStatus(session.id, update_types_1.UpdateSessionState.FAILED, error.message);
        this.eventEmitter.emit('update.error', {
            sessionId: session.id,
            deviceId: session.deviceId,
            error: error.message
        });
    }
    async updateSessionStatus(sessionId, status, error) {
        await this.updateSessionRepository.update({ id: sessionId }, {
            status,
            lastActivityAt: new Date(),
            error
        });
        this.eventEmitter.emit('update.status.changed', {
            sessionId,
            status,
            timestamp: new Date().toISOString(),
            error
        });
    }
    async updateSessionProgress(sessionId, progress) {
        await this.updateSessionRepository.update({ id: sessionId }, progress);
    }
    async getChunkData(type, sourceId, chunkIndex, chunkSize) {
        if (type === update_types_1.UpdateType.FIRMWARE) {
            const firmware = await this.firmwareRepository.findOne({
                where: { id: sourceId }
            });
            if (!firmware) {
                throw new Error(`Firmware ${sourceId} not found`);
            }
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, firmware.data.length);
            return Buffer.from(firmware.data.subarray(start, end));
        }
        else {
            throw new Error('Configuration updates not yet implemented');
        }
    }
    calculateChecksum(data) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum.toString(16).padStart(8, '0');
    }
    isCompatible(deviceInfo, firmware) {
        if (firmware.deviceType !== deviceInfo.type) {
            return false;
        }
        return true;
    }
    estimateUpdateDuration(deviceInfo, dataSize, chunkSize) {
        const chunks = Math.ceil(dataSize / chunkSize);
        const timePerChunk = 1000;
        return chunks * timePerChunk + 30000;
    }
};
exports.OTAUpdateService = OTAUpdateService;
exports.OTAUpdateService = OTAUpdateService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(firmware_entity_1.Firmware)),
    __param(2, (0, typeorm_1.InjectRepository)(update_session_entity_1.UpdateSession)),
    __metadata("design:paramtypes", [device_communication_service_1.DeviceCommunicationService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], OTAUpdateService);
//# sourceMappingURL=ota-update.service.js.map