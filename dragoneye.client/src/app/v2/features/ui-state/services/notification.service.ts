import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private idCounter = 0;

  success(title: string, message?: string, duration = 5000): string {
    return this.addNotification({
      type: 'success',
      title,
      message,
      duration,
      dismissible: true
    });
  }

  error(title: string, message?: string, duration = 8000): string {
    return this.addNotification({
      type: 'error',
      title,
      message,
      duration,
      dismissible: true
    });
  }

  warning(title: string, message?: string, duration = 6000): string {
    return this.addNotification({
      type: 'warning',
      title,
      message,
      duration,
      dismissible: true
    });
  }

  info(title: string, message?: string, duration = 5000): string {
    return this.addNotification({
      type: 'info',
      title,
      message,
      duration,
      dismissible: true
    });
  }

  addNotification(notification: Omit<Notification, 'id'>): string {
    const id = `notification-${++this.idCounter}`;
    const fullNotification: Notification = {
      id,
      ...notification
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, fullNotification]);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
    }

    return id;
  }

  dismiss(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filtered = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filtered);
  }

  dismissAll(): void {
    this.notificationsSubject.next([]);
  }

  // Quick methods for common file operations
  saveSuccess(filename: string): string {
    return this.success(
      'File Saved',
      `Successfully saved "${filename}"`,
      4000
    );
  }

  saveError(filename: string, error: string): string {
    return this.error(
      'Save Failed',
      `Failed to save "${filename}": ${error}`,
      6000
    );
  }

  loadSuccess(filename: string): string {
    return this.success(
      'File Loaded',
      `Successfully loaded "${filename}"`,
      4000
    );
  }

  loadError(filename: string, error: string): string {
    return this.error(
      'Load Failed',
      `Failed to load "${filename}": ${error}`,
      6000
    );
  }

  exportSuccess(filename: string): string {
    return this.success(
      'Export Complete',
      `Successfully exported "${filename}"`,
      4000
    );
  }

  exportError(error: string): string {
    return this.error(
      'Export Failed',
      error,
      6000
    );
  }
}
