import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ContextMenuContext, ContextMenuEvent } from '../../../features/ui-state/services/context-menu.service';

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  separator?: boolean;
  danger?: boolean;
  callback: () => void;
}

@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css'],
  standalone: false
})
export class ContextMenuComponent implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenuElement!: ElementRef<HTMLElement>;
  
  @Output() contextMenuAction = new EventEmitter<ContextMenuEvent>();
  
  private destroy$ = new Subject<void>();
  
  isVisible = false;
  context: ContextMenuContext | null = null;
  actions: ContextMenuAction[] = [];
  position = { x: 0, y: 0 };

  ngOnInit(): void {
    // Listen for clicks outside the context menu to close it
    document.addEventListener('click', this.onDocumentClick.bind(this));
    document.addEventListener('contextmenu', this.onDocumentContextMenu.bind(this));
    
    // Listen for escape key to close menu
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    document.removeEventListener('click', this.onDocumentClick.bind(this));
    document.removeEventListener('contextmenu', this.onDocumentContextMenu.bind(this));
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
  }

  trackByActionId(index: number, action: ContextMenuAction): string {
    return action.id;
  }

  show(context: ContextMenuContext): void {
    console.log('🎯 ContextMenuComponent.show called with:', context);
    this.context = context;
    this.actions = this.generateActions(context);
    this.position = this.adjustPosition(context.position);
    this.isVisible = true;

    console.log('🎯 Context menu visible:', this.isVisible, 'at position:', this.position, 'with actions:', this.actions);

    // Focus the menu for keyboard navigation
    setTimeout(() => {
      if (this.contextMenuElement) {
        this.contextMenuElement.nativeElement.focus();
      }
    }, 0);
  }

  hide(): void {
    console.log('🎯 ContextMenuComponent.hide called');
    this.isVisible = false;
    this.context = null;
    this.actions = [];
  }

  executeAction(action: ContextMenuAction): void {
    if (action.enabled) {
      action.callback();
      this.hide();
    }
  }

  private generateActions(context: ContextMenuContext): ContextMenuAction[] {
    switch (context.type) {
      case 'card':
        return this.generateCardActions(context);
      case 'group':
        return this.generateGroupActions(context);
      case 'multipleCards':
        return this.generateMultipleCardsActions(context);
      case 'background':
        return this.generateBackgroundActions(context);
      default:
        return [];
    }
  }

  private generateCardActions(context: ContextMenuContext): ContextMenuAction[] {
    // Calculate if move actions should be enabled
    const canMoveLeft = context.cardIndex! > 0;
    const canMoveRight = context.cardCount !== undefined ? 
      context.cardIndex! < context.cardCount - 1 : 
      true; // Fallback to true if cardCount not provided
    
    return [
      {
        id: 'edit-card',
        label: 'Edit Card',
        icon: 'bi-pencil',
        enabled: true,
        callback: () => this.emitAction('edit-card', context.groupIndex, context.cardIndex)
      },
      {
        id: 'duplicate-card',
        label: 'Duplicate Card',
        icon: 'bi-files',
        enabled: true,
        callback: () => this.emitAction('duplicate-card', context.groupIndex, context.cardIndex)
      },
      {
        id: 'separator-1',
        label: '',
        icon: '',
        enabled: false,
        separator: true,
        callback: () => {}
      },
      {
        id: 'move-left',
        label: 'Move Left',
        icon: 'bi-arrow-left',
        enabled: canMoveLeft,
        callback: () => this.emitAction('move-card', context.groupIndex, context.cardIndex, 'left')
      },
      {
        id: 'move-right',
        label: 'Move Right',
        icon: 'bi-arrow-right',
        enabled: canMoveRight,
        callback: () => this.emitAction('move-card', context.groupIndex, context.cardIndex, 'right')
      },
      {
        id: 'separator-2',
        label: '',
        icon: '',
        enabled: false,
        separator: true,
        callback: () => {}
      },
      {
        id: 'delete-card',
        label: 'Delete Card',
        icon: 'bi-trash',
        enabled: true,
        danger: true,
        callback: () => this.emitAction('delete-card', context.groupIndex, context.cardIndex)
      }
    ];
  }

  private generateGroupActions(context: ContextMenuContext): ContextMenuAction[] {
    return [
      {
        id: 'rename-group',
        label: 'Rename Group',
        icon: 'bi-pencil',
        enabled: true,
        callback: () => this.emitAction('rename-group', context.groupIndex)
      },
      {
        id: 'add-card',
        label: 'Add Card',
        icon: 'bi-plus',
        enabled: true,
        callback: () => this.emitAction('add-card', context.groupIndex)
      },
      {
        id: 'separator-1',
        label: '',
        icon: '',
        enabled: false,
        separator: true,
        callback: () => {}
      },
      {
        id: 'duplicate-group',
        label: 'Duplicate Group',
        icon: 'bi-files',
        enabled: true,
        callback: () => this.emitAction('duplicate-group', context.groupIndex)
      },
      {
        id: 'separator-2',
        label: '',
        icon: '',
        enabled: false,
        separator: true,
        callback: () => {}
      },
      {
        id: 'delete-group',
        label: 'Delete Group',
        icon: 'bi-trash',
        enabled: true, // Will check if it's not the last group
        danger: true,
        callback: () => this.emitAction('delete-group', context.groupIndex)
      }
    ];
  }

  private generateMultipleCardsActions(context: ContextMenuContext): ContextMenuAction[] {
    const cardCount = context.selectedCards?.length || 0;
    
    return [
      {
        id: 'group-cards',
        label: `Group ${cardCount} Cards`,
        icon: 'bi-collection',
        enabled: true,
        callback: () => this.emitAction('group-cards', undefined, undefined, undefined, context.selectedCards)
      },
      {
        id: 'duplicate-cards',
        label: `Duplicate ${cardCount} Cards`,
        icon: 'bi-files',
        enabled: true,
        callback: () => this.emitAction('duplicate-cards', undefined, undefined, undefined, context.selectedCards)
      },
      {
        id: 'separator-1',
        label: '',
        icon: '',
        enabled: false,
        separator: true,
        callback: () => {}
      },
      {
        id: 'delete-cards',
        label: `Delete ${cardCount} Cards`,
        icon: 'bi-trash',
        enabled: true,
        danger: true,
        callback: () => this.emitAction('delete-cards', undefined, undefined, undefined, context.selectedCards)
      }
    ];
  }

  private generateBackgroundActions(context: ContextMenuContext): ContextMenuAction[] {
    return [
      {
        id: 'add-group',
        label: 'Add New Group',
        icon: 'bi-plus-circle',
        enabled: true,
        callback: () => this.emitAction('add-group')
      },
      {
        id: 'separator-1',
        label: '',
        icon: '',
        enabled: false,
        separator: true,
        callback: () => {}
      },
      {
        id: 'paste',
        label: 'Paste',
        icon: 'bi-clipboard',
        enabled: false, // Will be enabled if clipboard has content
        callback: () => this.emitAction('paste')
      }
    ];
  }

  private emitAction(
    action: string, 
    groupIndex?: number, 
    cardIndex?: number, 
    direction?: 'left' | 'right',
    selectedCards?: Array<{ groupIndex: number; cardIndex: number }>
  ): void {
    this.contextMenuAction.emit({
      action,
      groupIndex,
      cardIndex,
      direction,
      selectedCards
    });
  }

  private adjustPosition(requestedPosition: { x: number; y: number }): { x: number; y: number } {
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 300; // Approximate menu height
    const padding = 10;
    
    let x = requestedPosition.x;
    let y = requestedPosition.y;
    
    // Adjust if menu would go off-screen
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - padding;
    }
    
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - padding;
    }
    
    // Ensure minimum position
    x = Math.max(padding, x);
    y = Math.max(padding, y);
    
    return { x, y };
  }

  private onDocumentClick(event: Event): void {
    if (this.isVisible && this.contextMenuElement) {
      const target = event.target as HTMLElement;
      if (!this.contextMenuElement.nativeElement.contains(target)) {
        this.hide();
      }
    }
  }

  private onDocumentContextMenu(event: Event): void {
    // Hide context menu when right-clicking elsewhere
    if (this.isVisible) {
      this.hide();
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.isVisible && event.key === 'Escape') {
      this.hide();
    }
  }
}
