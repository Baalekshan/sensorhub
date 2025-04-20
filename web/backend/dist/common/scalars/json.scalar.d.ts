import { CustomScalar } from '@nestjs/graphql';
import { ValueNode } from 'graphql';
export declare class JSONScalar implements CustomScalar<any, any> {
    description: string;
    parseValue(value: any): any;
    serialize(value: any): any;
    parseLiteral(ast: ValueNode): any;
}
