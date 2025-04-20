import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebsocketGateway.name);
  private deviceSubscriptions: Map<string, Set<string>> = new Map();
  private clientRooms = new Map<string, Set<string>>();

  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate client using JWT token
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without authentication token`);
        client.disconnect();
        return;
      }

      try {
        const payload = this.jwtService.verify(token);
        client.data.user = payload;
        this.logger.log(`Client ${client.id} connected: ${payload.username || payload.email}`);
      } catch (error) {
        this.logger.warn(`Client ${client.id} provided invalid token`);
        client.disconnect();
        return;
      }
    } catch (error) {
      this.logger.error(`Error during WebSocket connection: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove client from all device subscriptions
    this.deviceSubscriptions.forEach((subscribers, deviceId) => {
      if (subscribers.has(client.id)) {
        subscribers.delete(client.id);
        this.logger.log(`Client ${client.id} unsubscribed from device ${deviceId}`);
      }
    });

    // Remove client from all rooms
    this.clientRooms.forEach((clients, room) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.clientRooms.delete(room);
        }
      }
    });

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() deviceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!deviceId) {
      return { error: 'Device ID is required' };
    }

    // Add client to device subscriptions
    if (!this.deviceSubscriptions.has(deviceId)) {
      this.deviceSubscriptions.set(deviceId, new Set());
    }
    
    this.deviceSubscriptions.get(deviceId).add(client.id);
    
    this.logger.log(`Client ${client.id} subscribed to device ${deviceId}`);
    return { success: true, deviceId };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() deviceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!deviceId) {
      return { error: 'Device ID is required' };
    }

    // Remove client from device subscriptions
    if (this.deviceSubscriptions.has(deviceId)) {
      this.deviceSubscriptions.get(deviceId).delete(client.id);
      this.logger.log(`Client ${client.id} unsubscribed from device ${deviceId}`);
    }
    
    return { success: true, deviceId };
  }

  @SubscribeMessage('sendData')
  handleSendData(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !data.deviceId) {
      return { error: 'Invalid data format' };
    }

    // Process and forward the data
    this.sendSensorData(data.deviceId, data);
    
    return { success: true };
  }

  // Send sensor data to all subscribed clients for a specific device
  sendSensorData(deviceId: string, data: any) {
    if (!this.deviceSubscriptions.has(deviceId)) {
      return;
    }

    const subscribers = this.deviceSubscriptions.get(deviceId);
    if (subscribers.size === 0) {
      return;
    }

    // Emit to all subscribed clients
    subscribers.forEach(clientId => {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        client.emit('sensorData', data);
      }
    });
  }

  // Notify subscribed clients when a device starts streaming
  notifyDeviceStreamStarted(deviceId: string) {
    if (!this.deviceSubscriptions.has(deviceId)) {
      return;
    }

    const subscribers = this.deviceSubscriptions.get(deviceId);
    if (subscribers.size === 0) {
      return;
    }

    // Emit to all subscribed clients
    subscribers.forEach(clientId => {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        client.emit('deviceStreamStarted', { deviceId });
      }
    });
  }

  // Broadcast to all clients
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
    this.logger.log(`Client ${client.id} joining room: ${room}`);
    
    // Add client to room
    client.join(room);
    
    // Keep track of which rooms the client is in
    if (!this.clientRooms.has(room)) {
      this.clientRooms.set(room, new Set());
    }
    this.clientRooms.get(room).add(client.id);
    
    return { success: true, message: `Joined room: ${room}` };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
    this.logger.log(`Client ${client.id} leaving room: ${room}`);
    
    // Remove client from room
    client.leave(room);
    
    // Update tracking
    if (this.clientRooms.has(room)) {
      this.clientRooms.get(room).delete(client.id);
      if (this.clientRooms.get(room).size === 0) {
        this.clientRooms.delete(room);
      }
    }
    
    return { success: true, message: `Left room: ${room}` };
  }

  @SubscribeMessage('subscribeToDevice')
  handleSubscribeToDevice(@ConnectedSocket() client: Socket, @MessageBody() deviceId: string) {
    const room = `device:${deviceId}`;
    return this.handleJoinRoom(client, room);
  }

  @SubscribeMessage('unsubscribeFromDevice')
  handleUnsubscribeFromDevice(@ConnectedSocket() client: Socket, @MessageBody() deviceId: string) {
    const room = `device:${deviceId}`;
    return this.handleLeaveRoom(client, room);
  }

  /**
   * Emit an event to all clients in a room
   * @param room The room to emit to
   * @param event The event name
   * @param data The data to emit
   */
  emitToRoom(room: string, event: string, data: any) {
    this.logger.debug(`Emitting ${event} to room ${room}`);
    this.server.to(room).emit(event, data);
  }

  /**
   * Emit an event to all connected clients
   * @param event The event name
   * @param data The data to emit
   */
  emitToAll(event: string, data: any) {
    this.logger.debug(`Emitting ${event} to all clients`);
    this.server.emit(event, data);
  }

  /**
   * Emit an event to a specific client
   * @param clientId The client socket ID
   * @param event The event name
   * @param data The data to emit
   */
  emitToClient(clientId: string, event: string, data: any) {
    this.logger.debug(`Emitting ${event} to client ${clientId}`);
    this.server.to(clientId).emit(event, data);
  }
} 