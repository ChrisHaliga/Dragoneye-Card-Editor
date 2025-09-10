import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { ModalState } from '../../../core/models/ui-state.model';

export interface ModalConfig {
  id: string;
  title?: string;
  data?: any;
  closable?: boolean;
  backdrop?: 'static' | 'clickable';
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalStateSubject = new BehaviorSubject<ModalState>({
    fileManagerOpen: false,
    overwriteModalOpen: false,
    gettingStartedOpen: false,
    preferencesOpen: false,
    saveAsOpen: false,
    deleteConfirmationOpen: false,
    keyboardShortcutsOpen: false,
    aboutOpen: false
  });

  private openModals = new Map<string, ModalConfig>();
  private modalStack: string[] = [];

  public modalState$ = this.modalStateSubject.asObservable();

  get currentModalState(): ModalState {
    return this.modalStateSubject.value;
  }

  get hasOpenModals(): boolean {
    return this.modalStack.length > 0;
  }

  get topModal(): ModalConfig | null {
    if (this.modalStack.length === 0) return null;
    const topModalId = this.modalStack[this.modalStack.length - 1];
    return this.openModals.get(topModalId) || null;
  }

  openFileManager(data?: any): void {
    this.openModal('fileManager', {
      id: 'fileManager',
      title: 'File Manager',
      data,
      closable: true,
      backdrop: 'clickable'
    });
    this.updateModalState({ fileManagerOpen: true });
  }

  closeFileManager(): void {
    this.closeModal('fileManager');
    this.updateModalState({ fileManagerOpen: false });
  }

  openOverwriteModal(filename: string): void {
    this.openModal('overwrite', {
      id: 'overwrite',
      title: 'File Exists',
      data: { filename },
      closable: true,
      backdrop: 'static'
    });
    this.updateModalState({ overwriteModalOpen: true });
  }

  closeOverwriteModal(): void {
    this.closeModal('overwrite');
    this.updateModalState({ overwriteModalOpen: false });
  }

  openGettingStarted(): void {
    this.openModal('gettingStarted', {
      id: 'gettingStarted',
      title: 'Getting Started',
      closable: true,
      backdrop: 'clickable'
    });
    this.updateModalState({ gettingStartedOpen: true });
  }

  closeGettingStarted(): void {
    this.closeModal('gettingStarted');
    this.updateModalState({ gettingStartedOpen: false });
  }

  openPreferences(): void {
    this.openModal('preferences', {
      id: 'preferences',
      title: 'Preferences',
      closable: true,
      backdrop: 'clickable'
    });
    this.updateModalState({ preferencesOpen: true });
  }

  closePreferences(): void {
    this.closeModal('preferences');
    this.updateModalState({ preferencesOpen: false });
  }

  openSaveAs(currentFilename?: string): void {
    this.openModal('saveAs', {
      id: 'saveAs',
      title: 'Save As',
      data: { currentFilename },
      closable: true,
      backdrop: 'static'
    });
    this.updateModalState({ saveAsOpen: true });
  }

  closeSaveAs(): void {
    this.closeModal('saveAs');
    this.updateModalState({ saveAsOpen: false });
  }

  openDeleteConfirmation(itemName: string, itemType: 'card' | 'group' | 'detail'): void {
    this.openModal('deleteConfirmation', {
      id: 'deleteConfirmation',
      title: 'Confirm Delete',
      data: { itemName, itemType },
      closable: true,
      backdrop: 'static'
    });
    this.updateModalState({ deleteConfirmationOpen: true });
  }

  closeDeleteConfirmation(): void {
    this.closeModal('deleteConfirmation');
    this.updateModalState({ deleteConfirmationOpen: false });
  }

  openKeyboardShortcuts(): void {
    this.openModal('keyboardShortcuts', {
      id: 'keyboardShortcuts',
      title: 'Keyboard Shortcuts',
      closable: true,
      backdrop: 'clickable'
    });
    this.updateModalState({ keyboardShortcutsOpen: true });
  }

  closeKeyboardShortcuts(): void {
    this.closeModal('keyboardShortcuts');
    this.updateModalState({ keyboardShortcutsOpen: false });
  }

  openAbout(): void {
    this.openModal('about', {
      id: 'about',
      title: 'About Dragoneye',
      closable: true,
      backdrop: 'clickable'
    });
    this.updateModalState({ aboutOpen: true });
  }

  closeAbout(): void {
    this.closeModal('about');
    this.updateModalState({ aboutOpen: false });
  }

  openCustomModal(config: ModalConfig): void {
    this.openModal(config.id, config);
  }

  closeCustomModal(id: string): void {
    this.closeModal(id);
  }

  openModal(id: string, config: ModalConfig): void {
    // Close existing modal with same ID if exists
    if (this.openModals.has(id)) {
      this.closeModal(id);
    }

    this.openModals.set(id, config);
    this.modalStack.push(id);
  }

  closeModal(id: string): void {
    if (!this.openModals.has(id)) return;

    this.openModals.delete(id);
    const index = this.modalStack.indexOf(id);
    if (index > -1) {
      this.modalStack.splice(index, 1);
    }
  }

  closeTopModal(): void {
    if (this.modalStack.length === 0) return;
    
    const topModalId = this.modalStack[this.modalStack.length - 1];
    const topModal = this.openModals.get(topModalId);
    
    if (topModal?.closable !== false) {
      this.closeModal(topModalId);
      this.updateBuiltInModalState(topModalId, false);
    }
  }

  closeAllModals(): void {
    const modalIds = [...this.modalStack];
    modalIds.forEach(id => this.closeModal(id));
    this.resetModalState();
  }

  isModalOpen(id: string): boolean {
    return this.openModals.has(id);
  }

  getModalData(id: string): any {
    const modal = this.openModals.get(id);
    return modal?.data || null;
  }

  getModalConfig(id: string): ModalConfig | null {
    return this.openModals.get(id) || null;
  }

  getOpenModalIds(): string[] {
    return [...this.modalStack];
  }

  handleEscapeKey(): boolean {
    if (this.modalStack.length === 0) return false;
    
    const topModalId = this.modalStack[this.modalStack.length - 1];
    const topModal = this.openModals.get(topModalId);
    
    if (topModal?.closable !== false) {
      this.closeTopModal();
      return true;
    }
    
    return false;
  }

  handleBackdropClick(modalId: string): boolean {
    const modal = this.openModals.get(modalId);
    
    if (modal?.backdrop === 'clickable') {
      this.closeModal(modalId);
      this.updateBuiltInModalState(modalId, false);
      return true;
    }
    
    return false;
  }

  setModalClosable(id: string, closable: boolean): void {
    const modal = this.openModals.get(id);
    if (modal) {
      modal.closable = closable;
      this.openModals.set(id, modal);
    }
  }

  updateModalData(id: string, data: any): void {
    const modal = this.openModals.get(id);
    if (modal) {
      modal.data = { ...modal.data, ...data };
      this.openModals.set(id, modal);
    }
  }

  // Observable for specific modal state
  getModalState(id: string): Observable<boolean> {
    return new Observable(observer => {
      const subscription = this.modalState$.subscribe(() => {
        observer.next(this.isModalOpen(id));
      });
      
      // Initial value
      observer.next(this.isModalOpen(id));
      
      return () => subscription.unsubscribe();
    });
  }

  private updateModalState(updates: Partial<ModalState>): void {
    const currentState = this.currentModalState;
    this.modalStateSubject.next({ ...currentState, ...updates });
  }

  private updateBuiltInModalState(modalId: string, isOpen: boolean): void {
    const updates: Partial<ModalState> = {};
    
    switch (modalId) {
      case 'fileManager':
        updates.fileManagerOpen = isOpen;
        break;
      case 'overwrite':
        updates.overwriteModalOpen = isOpen;
        break;
      case 'gettingStarted':
        updates.gettingStartedOpen = isOpen;
        break;
      case 'preferences':
        updates.preferencesOpen = isOpen;
        break;
      case 'saveAs':
        updates.saveAsOpen = isOpen;
        break;
      case 'deleteConfirmation':
        updates.deleteConfirmationOpen = isOpen;
        break;
      case 'keyboardShortcuts':
        updates.keyboardShortcutsOpen = isOpen;
        break;
      case 'about':
        updates.aboutOpen = isOpen;
        break;
    }
    
    if (Object.keys(updates).length > 0) {
      this.updateModalState(updates);
    }
  }

  private resetModalState(): void {
    this.modalStateSubject.next({
      fileManagerOpen: false,
      overwriteModalOpen: false,
      gettingStartedOpen: false,
      preferencesOpen: false,
      saveAsOpen: false,
      deleteConfirmationOpen: false,
      keyboardShortcutsOpen: false,
      aboutOpen: false
    });
  }
}
