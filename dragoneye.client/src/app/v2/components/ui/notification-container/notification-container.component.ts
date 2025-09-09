import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NotificationService, Notification } from '../../../features/ui-state/services/notification.service';

@Component({
  selector: 'app-notification-container',
  templateUrl: './notification-container.component.html',
  styleUrls: ['./notification-container.component.css'],
  standalone: false
})
export class NotificationContainerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notifications => {
      this.notifications = notifications;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByFn(index: number, notification: Notification): string {
    return notification.id;
  }

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  executeAction(notification: Notification): void {
    if (notification.action) {
      notification.action.callback();
      this.dismiss(notification.id);
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'bi-check-circle';
      case 'error': return 'bi-exclamation-triangle';
      case 'warning': return 'bi-exclamation-triangle';
      case 'info': return 'bi-info-circle';
      default: return 'bi-info-circle';
    }
  }
}
