import { Injectable, MessageEvent, Logger } from '@nestjs/common';
import { Subject, Observable, interval, merge } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NotificationItemResponse } from '../dto/notification.dto';

export interface UserNotificationPayload {
  userId: string;
  notification: NotificationItemResponse;
}

@Injectable()
export class NotificationStreamService {
  private readonly logger = new Logger(NotificationStreamService.name);
  private readonly stream$ = new Subject<UserNotificationPayload>();

  /**
   * Broadcast a notification payload to connected SSE clients
   */
  emitNotification(
    userId: string,
    notification: NotificationItemResponse,
  ): void {
    try {
      this.stream$.next({ userId, notification });
    } catch (error) {
      this.logger.error(
        `Failed to emit real-time notification to user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Create an Observable stream of MessageEvents for a specific authenticated user.
   * Includes a 25-second heartbeat ping to prevent proxy/firewall disconnects.
   */
  subscribeToUserStream(userId: string): Observable<MessageEvent> {
    const userNotification$ = this.stream$.asObservable().pipe(
      filter((payload) => payload.userId === userId),
      map((payload): MessageEvent => ({
        data: payload.notification,
        type: 'notification',
      })),
    );

    // Keep connection alive with periodic heartbeat
    const heartbeat$ = interval(25000).pipe(
      map((): MessageEvent => ({
        data: { type: 'heartbeat', timestamp: new Date().toISOString() },
        type: 'ping',
      })),
    );

    return merge(userNotification$, heartbeat$);
  }
}
