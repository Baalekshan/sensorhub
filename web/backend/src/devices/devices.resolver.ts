import { Resolver, Query, Mutation, Args, ID, Context, Subscription } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { Inject } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { Device } from './entities/device.entity';
import { CreateDeviceInput } from './dto/create-device.input';
import { UpdateDeviceInput } from './dto/update-device.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PUB_SUB, SubscriptionEvents } from '../websocket/constants';

@Resolver(() => Device)
export class DevicesResolver {
  constructor(
    private readonly devicesService: DevicesService,
    @Inject(PUB_SUB) private pubSub: PubSub,
  ) {}

  @Query(() => [Device])
  @UseGuards(GqlAuthGuard)
  async devices(@CurrentUser() user: User) {
    return this.devicesService.findAll(user.id);
  }

  @Query(() => Device)
  @UseGuards(GqlAuthGuard)
  async device(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.devicesService.findOne(id, user.id);
  }

  @Mutation(() => Device)
  @UseGuards(GqlAuthGuard)
  async createDevice(
    @Args('createDeviceInput') createDeviceInput: CreateDeviceInput,
    @CurrentUser() user: User,
  ) {
    const device = await this.devicesService.create({
      ...createDeviceInput,
      userId: user.id,
    });
    
    // Publish device created event for subscriptions
    await this.pubSub.publish(SubscriptionEvents.DEVICE_CONNECTED, { 
      deviceCreated: device,
      userId: user.id,
    });
    
    return device;
  }

  @Mutation(() => Device)
  @UseGuards(GqlAuthGuard)
  async updateDevice(
    @Args('updateDeviceInput') updateDeviceInput: UpdateDeviceInput,
    @CurrentUser() user: User,
  ) {
    const updatedDevice = await this.devicesService.update(
      updateDeviceInput.id,
      updateDeviceInput,
      user.id,
    );
    
    // Publish device updated event for subscriptions
    await this.pubSub.publish(SubscriptionEvents.DEVICE_STATUS_UPDATED, { 
      deviceUpdated: updatedDevice,
      userId: user.id,
    });
    
    return updatedDevice;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async removeDevice(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    const removed = await this.devicesService.remove(id, user.id);
    
    if (removed) {
      // Publish device removed event for subscriptions
      await this.pubSub.publish(SubscriptionEvents.DEVICE_DISCONNECTED, { 
        deviceRemoved: id,
        userId: user.id,
      });
    }
    
    return removed;
  }

  // Subscriptions
  @Subscription(() => Device, {
    filter: (payload, variables) => {
      return payload.userId === variables.userId;
    },
  })
  deviceCreated(
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    return this.pubSub.asyncIterator(SubscriptionEvents.DEVICE_CONNECTED);
  }

  @Subscription(() => Device, {
    filter: (payload, variables) => {
      return payload.userId === variables.userId;
    },
  })
  deviceUpdated(
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    return this.pubSub.asyncIterator(SubscriptionEvents.DEVICE_STATUS_UPDATED);
  }

  @Subscription(() => ID, {
    filter: (payload, variables) => {
      return payload.userId === variables.userId;
    },
  })
  deviceRemoved(
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    return this.pubSub.asyncIterator(SubscriptionEvents.DEVICE_DISCONNECTED);
  }
} 