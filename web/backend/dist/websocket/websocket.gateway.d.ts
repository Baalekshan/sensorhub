import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private readonly logger;
    private deviceSubscriptions;
    private clientRooms;
    server: Server;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleSubscribe(deviceId: string, client: Socket): {
        error: string;
        success?: undefined;
        deviceId?: undefined;
    } | {
        success: boolean;
        deviceId: string;
        error?: undefined;
    };
    handleUnsubscribe(deviceId: string, client: Socket): {
        error: string;
        success?: undefined;
        deviceId?: undefined;
    } | {
        success: boolean;
        deviceId: string;
        error?: undefined;
    };
    handleSendData(data: any, client: Socket): {
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    };
    sendSensorData(deviceId: string, data: any): void;
    notifyDeviceStreamStarted(deviceId: string): void;
    broadcastToAll(event: string, data: any): void;
    handleJoinRoom(client: Socket, room: string): {
        success: boolean;
        message: string;
    };
    handleLeaveRoom(client: Socket, room: string): {
        success: boolean;
        message: string;
    };
    handleSubscribeToDevice(client: Socket, deviceId: string): {
        success: boolean;
        message: string;
    };
    handleUnsubscribeFromDevice(client: Socket, deviceId: string): {
        success: boolean;
        message: string;
    };
    emitToRoom(room: string, event: string, data: any): void;
    emitToAll(event: string, data: any): void;
    emitToClient(clientId: string, event: string, data: any): void;
}
