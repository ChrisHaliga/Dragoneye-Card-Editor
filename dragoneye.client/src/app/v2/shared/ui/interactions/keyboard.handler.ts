import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: string;
  description: string;
}

export interface KeyboardShortcutEvent {
  shortcut: KeyboardShortcut;
  originalEvent: globalThis.KeyboardEvent;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardHandler {
  private shortcuts = new Map<string, KeyboardShortcut>();
  private keyboardEvents = new Subject<KeyboardShortcutEvent>();
  
  public keyboardEvents$ = this.keyboardEvents.asObservable();

  constructor() {
    this.registerDefaultShortcuts();
    this.setupEventListeners();
  }

  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  unregisterShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.delete(key);
  }

  getRegisteredShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsByCategory(): { [category: string]: KeyboardShortcut[] } {
    const shortcuts = this.getRegisteredShortcuts();
    const categories: { [category: string]: KeyboardShortcut[] } = {};

    shortcuts.forEach(shortcut => {
      const category = this.getShortcutCategory(shortcut.action);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(shortcut);
    });

    return categories;
  }

  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey || shortcut.metaKey) {
      parts.push('Ctrl');
    }
    if (shortcut.shiftKey) {
      parts.push('Shift');
    }
    if (shortcut.altKey) {
      parts.push('Alt');
    }
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  }

  private registerDefaultShortcuts(): void {
    const defaultShortcuts: KeyboardShortcut[] = [
      // File operations
      { key: 's', ctrlKey: true, action: 'save', description: 'Save current file' },
      { key: 's', ctrlKey: true, shiftKey: true, action: 'saveAs', description: 'Save as new file' },
      { key: 'o', ctrlKey: true, action: 'open', description: 'Open file' },
      { key: 'n', ctrlKey: true, action: 'new', description: 'New file' },
      { key: 'e', ctrlKey: true, action: 'export', description: 'Export data' },
      
      // Edit operations
      { key: 'z', ctrlKey: true, action: 'undo', description: 'Undo last action' },
      { key: 'y', ctrlKey: true, action: 'redo', description: 'Redo last action' },
      { key: 'z', ctrlKey: true, shiftKey: true, action: 'redo', description: 'Redo last action' },
      { key: 'c', ctrlKey: true, action: 'copy', description: 'Copy selected item' },
      { key: 'v', ctrlKey: true, action: 'paste', description: 'Paste item' },
      { key: 'x', ctrlKey: true, action: 'cut', description: 'Cut selected item' },
      { key: 'Delete', action: 'delete', description: 'Delete selected item' },
      { key: 'd', ctrlKey: true, action: 'duplicate', description: 'Duplicate selected item' },
      
      // View operations
      { key: '=', ctrlKey: true, action: 'zoomIn', description: 'Zoom in' },
      { key: '-', ctrlKey: true, action: 'zoomOut', description: 'Zoom out' },
      { key: '0', ctrlKey: true, action: 'resetZoom', description: 'Reset zoom' },
      { key: 'f', ctrlKey: true, action: 'focusCard', description: 'Focus on selected card' },
      
      // Navigation and card movement
      { key: 'ArrowUp', action: 'selectPrevious', description: 'Select previous item' },
      { key: 'ArrowDown', action: 'selectNext', description: 'Select next item' },
      { key: 'ArrowLeft', action: 'moveLeft', description: 'Move selected card left' },
      { key: 'ArrowRight', action: 'moveRight', description: 'Move selected card right' },
      { key: 'Home', action: 'selectFirst', description: 'Select first item' },
      { key: 'End', action: 'selectLast', description: 'Select last item' },
      
      // Application
      { key: ',', ctrlKey: true, action: 'preferences', description: 'Open preferences' },
      { key: '/', ctrlKey: true, action: 'shortcuts', description: 'Show keyboard shortcuts' },
      { key: 'F1', action: 'help', description: 'Show help' },
      { key: 'Escape', action: 'escape', description: 'Cancel current action' },
      
      // Panel management
      { key: '1', ctrlKey: true, action: 'toggleHierarchy', description: 'Toggle hierarchy panel' },
      { key: '2', ctrlKey: true, action: 'toggleProperties', description: 'Toggle properties panel' },
      { key: '3', ctrlKey: true, action: 'toggleDisplay', description: 'Toggle display panel' }
    ];

    defaultShortcuts.forEach(shortcut => this.registerShortcut(shortcut));
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', (event: globalThis.KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true';
      
      if (isInputField) {
        // Allow normal keyboard behavior in input fields
        return;
      }
      
      const shortcut = this.findMatchingShortcut(event);
      if (shortcut) {
        // Only prevent default for registered shortcuts
        event.preventDefault();
        this.keyboardEvents.next({
          shortcut,
          originalEvent: event
        });
      }
    });
  }

  private findMatchingShortcut(event: globalThis.KeyboardEvent): KeyboardShortcut | null {
    const key = this.getEventKey(event);
    return this.shortcuts.get(key) || null;
  }

  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts = [
      shortcut.ctrlKey ? 'ctrl' : '',
      shortcut.shiftKey ? 'shift' : '',
      shortcut.altKey ? 'alt' : '',
      shortcut.metaKey ? 'meta' : '',
      shortcut.key.toLowerCase()
    ].filter(Boolean);
    
    return parts.join('+');
  }

  private getEventKey(event: globalThis.KeyboardEvent): string {
    const parts = [
      event.ctrlKey || event.metaKey ? 'ctrl' : '',
      event.shiftKey ? 'shift' : '',
      event.altKey ? 'alt' : '',
      event.metaKey && !event.ctrlKey ? 'meta' : '',
      event.key.toLowerCase()
    ].filter(Boolean);
    
    return parts.join('+');
  }

  private getShortcutCategory(action: string): string {
    if (['save', 'saveAs', 'open', 'new', 'export'].includes(action)) return 'File';
    if (['undo', 'redo', 'copy', 'paste', 'cut', 'delete', 'duplicate'].includes(action)) return 'Edit';
    if (['zoomIn', 'zoomOut', 'resetZoom', 'focusCard'].includes(action)) return 'View';
    if (['selectPrevious', 'selectNext', 'selectFirst', 'selectLast'].includes(action)) return 'Navigation';
    if (['moveLeft', 'moveRight'].includes(action)) return 'Card Movement';
    if (['toggleHierarchy', 'toggleProperties', 'toggleDisplay'].includes(action)) return 'Panels';
    if (['preferences', 'shortcuts', 'help', 'escape'].includes(action)) return 'Application';
    return 'Other';
  }
}
