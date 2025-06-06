"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensorsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sensor_entity_1 = require("./entities/sensor.entity");
const sensor_type_entity_1 = require("./entities/sensor-type.entity");
const sensor_reading_entity_1 = require("./entities/sensor-reading.entity");
const calibration_record_entity_1 = require("./entities/calibration-record.entity");
const sensors_service_1 = require("./sensors.service");
const sensors_resolver_1 = require("./sensors.resolver");
const sensors_controller_1 = require("./sensors.controller");
let SensorsModule = class SensorsModule {
};
exports.SensorsModule = SensorsModule;
exports.SensorsModule = SensorsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                sensor_entity_1.Sensor,
                sensor_type_entity_1.SensorType,
                sensor_reading_entity_1.SensorReading,
                calibration_record_entity_1.CalibrationRecord,
            ]),
        ],
        controllers: [sensors_controller_1.SensorsController],
        providers: [sensors_service_1.SensorsService, sensors_resolver_1.SensorsResolver],
        exports: [sensors_service_1.SensorsService],
    })
], SensorsModule);
//# sourceMappingURL=sensors.module.js.map