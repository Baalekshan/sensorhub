"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const device_entity_1 = require("./entities/device.entity");
const devices_controller_1 = require("./devices.controller");
const devices_service_1 = require("./devices.service");
const devices_resolver_1 = require("./devices.resolver");
const websocket_module_1 = require("../websocket/websocket.module");
const sensors_module_1 = require("../sensors/sensors.module");
const analytics_module_1 = require("../analytics/analytics.module");
const sensor_entity_1 = require("../sensors/entities/sensor.entity");
const sensor_reading_entity_1 = require("../sensors/entities/sensor-reading.entity");
const communications_module_1 = require("../communications/communications.module");
const user_entity_1 = require("../entities/user.entity");
let DevicesModule = class DevicesModule {
};
exports.DevicesModule = DevicesModule;
exports.DevicesModule = DevicesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([device_entity_1.Device, sensor_entity_1.Sensor, sensor_reading_entity_1.SensorReading, user_entity_1.User]),
            websocket_module_1.WebsocketModule,
            sensors_module_1.SensorsModule,
            analytics_module_1.AnalyticsModule,
            (0, common_1.forwardRef)(() => communications_module_1.CommunicationsModule),
        ],
        controllers: [devices_controller_1.DevicesController],
        providers: [devices_service_1.DevicesService, devices_resolver_1.DevicesResolver],
        exports: [devices_service_1.DevicesService],
    })
], DevicesModule);
//# sourceMappingURL=devices.module.js.map