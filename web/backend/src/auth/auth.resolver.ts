import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UseGuards } from '@nestjs/common';
import { LoginInput, LoginResponse, RegisterInput, RefreshTokensInput } from './dto/auth.dto';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Request } from 'express';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => LoginResponse)
  async login(@Args('input') input: LoginInput) {
    const user = await this.authService.validateUser(input.email, input.password);
    return this.authService.login(user);
  }

  @Mutation(() => LoginResponse)
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input.email, input.password, input.name);
  }

  @Mutation(() => LoginResponse)
  @UseGuards(JwtRefreshGuard)
  async refreshTokens(
    @CurrentUser() user: User & { refreshToken: string },
    @Args('input') input: RefreshTokensInput,
  ) {
    return this.authService.refreshTokens(user.id, user.refreshToken);
  }
} 