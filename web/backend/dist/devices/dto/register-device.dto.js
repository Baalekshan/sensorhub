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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDeviceDto = exports.ProfileDto = exports.SensorInfoDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class SensorInfoDto {
}
exports.SensorInfoDto = SensorInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique identifier for the sensor' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SensorInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type of sensor (e.g. BME280, HDC1080)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SensorInfoDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the sensor is calibrated', default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SensorInfoDto.prototype, "isCalibrated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the sensor is active', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SensorInfoDto.prototype, "isActive", void 0);
class ProfileDto {
}
exports.ProfileDto = ProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Profile identifier' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProfileDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Profile name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProfileDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Profile description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProfileDto.prototype, "description", void 0);
class RegisterDeviceDto {
}
exports.RegisterDeviceDto = RegisterDeviceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Device name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterDeviceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Bluetooth address or identifier' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterDeviceDto.prototype, "bluetoothAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Firmware version', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDeviceDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sensors connected to the device', type: [SensorInfoDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SensorInfoDto),
    __metadata("design:type", Array)
], RegisterDeviceDto.prototype, "sensors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Applied profile configuration', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ProfileDto),
    __metadata("design:type", ProfileDto)
], RegisterDeviceDto.prototype, "profile", void 0);
//# sourceMappingURL=register-device.dto.js.map