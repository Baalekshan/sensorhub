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
var WebsocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
let WebsocketGateway = WebsocketGateway_1 = class WebsocketGateway {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(WebsocketGateway_1.name);
        this.deviceSubscriptions = new Map();
        this.clientRooms = new Map();
    }
    async handleConnection(client) {
        var _a;
        try {
            const token = client.handshake.auth.token || ((_a = client.handshake.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
            if (!token) {
                this.logger.warn(`Client ${client.id} connected without authentication token`);
                client.disconnect();
                return;
            }
            try {
                const payload = this.jwtService.verify(token);
                client.data.user = payload;
                this.logger.log(`Client ${client.id} connected: ${payload.username || payload.email}`);
            }
            catch (error) {
                this.logger.warn(`Client ${client.id} provided invalid token`);
                client.disconnect();
                return;
            }
        }
        catch (error) {
            this.logger.error(`Error during WebSocket connection: ${error.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.deviceSubscriptions.forEach((subscribers, deviceId) => {
            if (subscribers.has(client.id)) {
                subscribers.delete(client.id);
                this.logger.log(`Client ${client.id} unsubscribed from device ${deviceId}`);
            }
        });
        this.clientRooms.forEach((clients, room) => {
            if (clients.has(client.id)) {
                clients.delete(client.id);
                if (clients.size === 0) {
                    this.clientRooms.delete(room);
                }
            }
        });
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleSubscribe(deviceId, client) {
        if (!deviceId) {
            return { error: 'Device ID is required' };
        }
        if (!this.deviceSubscriptions.has(deviceId)) {
            this.deviceSubscriptions.set(deviceId, new Set());
        }
        this.deviceSubscriptions.get(deviceId).add(client.id);
        this.logger.log(`Client ${client.id} subscribed to device ${deviceId}`);
        return { success: true, deviceId };
    }
    handleUnsubscribe(deviceId, client) {
        if (!deviceId) {
            return { error: 'Device ID is required' };
        }
        if (this.deviceSubscriptions.has(deviceId)) {
            this.deviceSubscriptions.get(deviceId).delete(client.id);
            this.logger.log(`Client ${client.id} unsubscribed from device ${deviceId}`);
        }
        return { success: true, deviceId };
    }
    handleSendData(data, client) {
        if (!data || !data.deviceId) {
            return { error: 'Invalid data format' };
        }
        this.sendSensorData(data.deviceId, data);
        return { success: true };
    }
    sendSensorData(deviceId, data) {
        if (!this.deviceSubscriptions.has(deviceId)) {
            return;
        }
        const subscribers = this.deviceSubscriptions.get(deviceId);
        if (subscribers.size === 0) {
            return;
        }
        subscribers.forEach(clientId => {
            const client = this.server.sockets.sockets.get(clientId);
            if (client) {
                client.emit('sensorData', data);
            }
        });
    }
    notifyDeviceStreamStarted(deviceId) {
        if (!this.deviceSubscriptions.has(deviceId)) {
            return;
        }
        const subscribers = this.deviceSubscriptions.get(deviceId);
        if (subscribers.size === 0) {
            return;
        }
        subscribers.forEach(clientId => {
            const client = this.server.sockets.sockets.get(clientId);
            if (client) {
                client.emit('deviceStreamStarted', { deviceId });
            }
        });
    }
    broadcastToAll(event, data) {
        this.server.emit(event, data);
    }
    handleJoinRoom(client, room) {
        this.logger.log(`Client ${client.id} joining room: ${room}`);
        client.join(room);
        if (!this.clientRooms.has(room)) {
            this.clientRooms.set(room, new Set());
        }
        this.clientRooms.get(room).add(client.id);
        return { success: true, message: `Joined room: ${room}` };
    }
    handleLeaveRoom(client, room) {
        this.logger.log(`Client ${client.id} leaving room: ${room}`);
        client.leave(room);
        if (this.clientRooms.has(room)) {
            this.clientRooms.get(room).delete(client.id);
            if (this.clientRooms.get(room).size === 0) {
                this.clientRooms.delete(room);
            }
        }
        return { success: true, message: `Left room: ${room}` };
    }
    handleSubscribeToDevice(client, deviceId) {
        const room = `device:${deviceId}`;
        return this.handleJoinRoom(client, room);
    }
    handleUnsubscribeFromDevice(client, deviceId) {
        const room = `device:${deviceId}`;
        return this.handleLeaveRoom(client, room);
    }
    emitToRoom(room, event, data) {
        this.logger.debug(`Emitting ${event} to room ${room}`);
        this.server.to(room).emit(event, data);
    }
    emitToAll(event, data) {
        this.logger.debug(`Emitting ${event} to all clients`);
        this.server.emit(event, data);
    }
    emitToClient(clientId, event, data) {
        this.logger.debug(`Emitting ${event} to client ${clientId}`);
        this.server.to(clientId).emit(event, data);
    }
};
exports.WebsocketGateway = WebsocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebsocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleUnsubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendData'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleSendData", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribeToDevice'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleSubscribeToDevice", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribeFromDevice'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleUnsubscribeFromDevice", null);
exports.WebsocketGateway = WebsocketGateway = WebsocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], WebsocketGateway);
//# sourceMappingURL=websocket.gateway.js.map