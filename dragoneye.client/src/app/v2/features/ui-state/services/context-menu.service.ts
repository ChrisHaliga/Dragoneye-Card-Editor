import { Injectable, ComponentRef, ViewContainerRef } from '@angular/core';
import { Subject } from 'rxjs';

export interface ContextMenuContext {
  type: 'card' | 'group' | 'multipleCards' | 'background';
  groupIndex?: number;
  cardIndex?: number;
  selectedCards?: Array<{ groupIndex: number; cardIndex: number }>;

  // Additional context for enabling/disabling actions
  cardCount?: number; // Total cards in the group

  position: { x: number; y: number };
}

export interface ContextMenuEvent {
  action: string;
  groupIndex?: number;
  cardIndex?: number;
  selectedCards?: Array<{ groupIndex: number; cardIndex: number }>;

  direction?: 'left' | 'right';
}

@Injectable({
  providedIn: 'root'
})
export class ContextMenuService {
  private contextMenuComponent: any | null = null;
  private contextMenuAction$ = new Subject<ContextMenuEvent>();
  
  public contextMenuActions$ = this.contextMenuAction$.asObservable();

  setContextMenuComponent(component: any): void {
    this.contextMenuComponent = component;
    
    // Subscribe to context menu actions
    component.contextMenuAction.subscribe((action: ContextMenuEvent) => {
      this.contextMenuAction$.next(action);
    });
  }

  show(context: ContextMenuContext): void {
    console.log('📋 ContextMenuService.show called with:', context);
    if (this.contextMenuComponent) {
      console.log('✅ Context menu component available, showing menu');
      this.contextMenuComponent.show(context);
    } else {
      console.error('❌ Context menu component not available');
    }
  }

  hide(): void {
    console.log('📋 ContextMenuService.hide called');
    if (this.contextMenuComponent) {
      this.contextMenuComponent.hide();
    }
  }

  showForCard(
    groupIndex: number, 
    cardIndex: number, 
    position: { x: number; y: number },
    cardCount?: number
  ): void {
    this.show({
      type: 'card',
      groupIndex,
      cardIndex,
      cardCount,
      position
    });
  }

  showForGroup(
    groupIndex: number, 
    position: { x: number; y: number }
  ): void {
    this.show({
      type: 'group',
      groupIndex,
      position
    });
  }

  showForMultipleCards(
    selectedCards: Array<{ groupIndex: number; cardIndex: number }>,
    position: { x: number; y: number }
  ): void {
    this.show({
      type: 'multipleCards',
      selectedCards,
      position
    });
  }

  showForBackground(position: { x: number; y: number }): void {
    this.show({
      type: 'background',
      position
    });
  }
}
