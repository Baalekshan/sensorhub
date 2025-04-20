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
exports.ConfigureDeviceDto = exports.SensorConfigDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class SensorConfigDto {
}
exports.SensorConfigDto = SensorConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sensor identifier' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SensorConfigDto.prototype, "sensorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the sensor is active', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SensorConfigDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the sensor is calibrated', default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SensorConfigDto.prototype, "isCalibrated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Calibration data for the sensor', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SensorConfigDto.prototype, "calibrationData", void 0);
class ConfigureDeviceDto {
}
exports.ConfigureDeviceDto = ConfigureDeviceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Device name', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureDeviceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Active profile name', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigureDeviceDto.prototype, "activeProfile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sensor configurations', type: [SensorConfigDto], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SensorConfigDto),
    __metadata("design:type", Array)
], ConfigureDeviceDto.prototype, "sensors", void 0);
//# sourceMappingURL=configure-device.dto.js.map