import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ModalService } from '../../../features/ui-state/services/modal.service';

@Component({
  selector: 'app-keyboard-shortcuts-modal-v2',
  templateUrl: './keyboard-shortcuts-modal.component.html',
  styleUrls: ['./keyboard-shortcuts-modal.component.css'],
  standalone: false
})
export class KeyboardShortcutsModalV2Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isVisible = false;

  constructor(private modalService: ModalService) {}

  ngOnInit(): void {
    // Subscribe to modal state from the modal service
    this.modalService.modalState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.isVisible = state.keyboardShortcutsOpen;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hide(): void {
    this.modalService.closeKeyboardShortcuts();
  }
}
