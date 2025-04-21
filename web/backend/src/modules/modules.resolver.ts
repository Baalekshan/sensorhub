import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ModulesService } from './modules.service';
import { Module } from './module.entity';

@Resolver(() => Module)
export class ModulesResolver {
  constructor(private readonly modulesService: ModulesService) {}

  @Query(() => [Module])
  async modules(): Promise<Module[]> {
    return this.modulesService.findAll();
  }

  @Query(() => Module)
  async module(@Args('id') id: string): Promise<Module> {
    return this.modulesService.findOne(id);
  }

  @Mutation(() => Module)
  async createModule(@Args('moduleData') moduleData: Partial<Module>): Promise<Module> {
    return this.modulesService.create(moduleData);
  }

  @Mutation(() => Module)
  async updateModule(
    @Args('id') id: string,
    @Args('moduleData') moduleData: Partial<Module>,
  ): Promise<Module> {
    return this.modulesService.update(id, moduleData);
  }

  @Mutation(() => Boolean)
  async removeModule(@Args('id') id: string): Promise<boolean> {
    await this.modulesService.remove(id);
    return true;
  }
} 