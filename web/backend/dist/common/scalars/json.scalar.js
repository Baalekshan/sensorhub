"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONScalar = void 0;
const graphql_1 = require("@nestjs/graphql");
const graphql_2 = require("graphql");
let JSONScalar = class JSONScalar {
    constructor() {
        this.description = 'JSON custom scalar type';
    }
    parseValue(value) {
        return value;
    }
    serialize(value) {
        return value;
    }
    parseLiteral(ast) {
        if (ast.kind === graphql_2.Kind.STRING) {
            try {
                return JSON.parse(ast.value);
            }
            catch (_a) {
                return ast.value;
            }
        }
        if (ast.kind === graphql_2.Kind.INT || ast.kind === graphql_2.Kind.FLOAT) {
            return Number(ast.value);
        }
        if (ast.kind === graphql_2.Kind.BOOLEAN) {
            return ast.value;
        }
        return null;
    }
};
exports.JSONScalar = JSONScalar;
exports.JSONScalar = JSONScalar = __decorate([
    (0, graphql_1.Scalar)('JSON', type => Object)
], JSONScalar);
//# sourceMappingURL=json.scalar.js.map