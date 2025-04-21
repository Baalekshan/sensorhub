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
exports.Permission = exports.PermissionScope = exports.PermissionType = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
var PermissionType;
(function (PermissionType) {
    PermissionType["CREATE"] = "CREATE";
    PermissionType["READ"] = "READ";
    PermissionType["UPDATE"] = "UPDATE";
    PermissionType["DELETE"] = "DELETE";
    PermissionType["ADMIN"] = "ADMIN";
    PermissionType["SPECIAL"] = "SPECIAL";
})(PermissionType || (exports.PermissionType = PermissionType = {}));
var PermissionScope;
(function (PermissionScope) {
    PermissionScope["USER"] = "USER";
    PermissionScope["ORGANIZATION"] = "ORGANIZATION";
    PermissionScope["DEVICE"] = "DEVICE";
    PermissionScope["SENSOR"] = "SENSOR";
    PermissionScope["READING"] = "READING";
    PermissionScope["ALERT"] = "ALERT";
    PermissionScope["FIRMWARE"] = "FIRMWARE";
    PermissionScope["REPORT"] = "REPORT";
    PermissionScope["DASHBOARD"] = "DASHBOARD";
    PermissionScope["SETTING"] = "SETTING";
    PermissionScope["SYSTEM"] = "SYSTEM";
})(PermissionScope || (exports.PermissionScope = PermissionScope = {}));
let Permission = class Permission {
};
exports.Permission = Permission;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Permission.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Permission.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Permission.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => PermissionType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PermissionType
    }),
    __metadata("design:type", String)
], Permission.prototype, "type", void 0);
__decorate([
    (0, graphql_1.Field)(() => PermissionScope),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PermissionScope
    }),
    __metadata("design:type", String)
], Permission.prototype, "scope", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Permission.prototype, "resource", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    (0, typeorm_1.Column)('simple-array'),
    __metadata("design:type", Array)
], Permission.prototype, "actions", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Permission.prototype, "isActive", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.GraphQLISODateTime),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Permission.prototype, "createdAt", void 0);
exports.Permission = Permission = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('permissions')
], Permission);
//# sourceMappingURL=permission.entity.js.map