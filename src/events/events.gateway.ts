import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventsService } from './events.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly eventsService: EventsService) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate the connection
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Add the client to the appropriate rooms
      const userId = await this.eventsService.validateToken(token);
      client.join(`user:${userId}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Clean up any necessary resources
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('subscribeToDatabase')
  async handleSubscribeToDatabase(client: Socket, payload: { connectionId: string }) {
    const { connectionId } = payload;
    client.join(`database:${connectionId}`);
    return { event: 'subscribed', connectionId };
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('unsubscribeFromDatabase')
  async handleUnsubscribeFromDatabase(client: Socket, payload: { connectionId: string }) {
    const { connectionId } = payload;
    client.leave(`database:${connectionId}`);
    return { event: 'unsubscribed', connectionId };
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('queryExecution')
  async handleQueryExecution(client: Socket, payload: { connectionId: string; query: string }) {
    try {
      const result = await this.eventsService.executeQuery(payload.connectionId, payload.query);
      return { event: 'queryResult', data: result };
    } catch (error) {
      return { event: 'queryError', error: error.message };
    }
  }

  // Method to broadcast database changes to all subscribed clients
  async broadcastDatabaseChange(connectionId: string, change: any) {
    this.server.to(`database:${connectionId}`).emit('databaseChange', change);
  }

  // Method to broadcast query results to specific client
  async broadcastQueryResult(clientId: string, result: any) {
    this.server.to(clientId).emit('queryResult', result);
  }
} 