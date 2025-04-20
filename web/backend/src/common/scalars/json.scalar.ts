import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('JSON', type => Object)
export class JSONScalar implements CustomScalar<any, any> {
  description = 'JSON custom scalar type';

  parseValue(value: any): any {
    return value;
  }

  serialize(value: any): any {
    return value;
  }

  parseLiteral(ast: ValueNode): any {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch {
        return ast.value;
      }
    }
    if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
      return Number(ast.value);
    }
    if (ast.kind === Kind.BOOLEAN) {
      return ast.value;
    }
    return null;
  }
} 