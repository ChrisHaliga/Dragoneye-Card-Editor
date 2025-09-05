import { Injectable } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastContainer: HTMLElement | null = null;

  constructor() {
    this.createToastContainer();
  }

  showAutoSaveToast(): void {
    this.show('Auto-saving...', 'info', 2000);
  }

  show(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', duration: number = 3000): void {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type, duration };
    
    this.toasts.push(toast);
    this.renderToast(toast);
    
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: string): void {
    const toastElement = document.getElementById(`toast-${id}`);
    if (toastElement) {
      toastElement.style.opacity = '0';
      toastElement.style.transform = 'translateX(100%)';
      setTimeout(() => toastElement.parentNode?.removeChild(toastElement), 300);
    }
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  private createToastContainer(): void {
    const existingContainer = document.querySelector('.toast-container');
    if (existingContainer) existingContainer.remove();

    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container';
    this.toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
      max-width: 300px;
    `;
    document.body.appendChild(this.toastContainer);
  }

  private renderToast(toast: Toast): void {
    if (!this.toastContainer) {
      this.createToastContainer();
      if (!this.toastContainer) return;
    }

    const toastElement = document.createElement('div');
    toastElement.id = `toast-${toast.id}`;
    
    const colors = {
      success: '#28a745',
      info: '#17a2b8',
      warning: '#ffc107',
      error: '#dc3545'
    };

    const icons = {
      success: 'bi-check-circle-fill',
      info: 'bi-info-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      error: 'bi-x-circle-fill'
    };

    toastElement.innerHTML = `
      <div style="display: flex; align-items: center;">
        <i class="bi ${icons[toast.type]} me-2"></i>
        <span>${toast.message}</span>
      </div>
    `;

    toastElement.style.cssText = `
      background: ${colors[toast.type]};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 14px;
      font-weight: 500;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      pointer-events: auto;
      cursor: pointer;
      min-width: 200px;
    `;

    toastElement.addEventListener('click', () => this.remove(toast.id));
    this.toastContainer.appendChild(toastElement);

    setTimeout(() => {
      toastElement.style.opacity = '1';
      toastElement.style.transform = 'translateX(0)';
    }, 10);
  }
}
