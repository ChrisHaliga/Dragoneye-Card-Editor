import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ModalService } from '../../../features/ui-state/services/modal.service';
import { PreferencesService } from '../../../features/preferences/services/preferences.service';

@Component({
  selector: 'app-getting-started-modal-v2',
  templateUrl: './getting-started-modal.component.html',
  styleUrls: ['./getting-started-modal.component.css'],
  standalone: false
})
export class GettingStartedModalV2Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isVisible = false;

  constructor(
    private modalService: ModalService,
    private preferencesService: PreferencesService
  ) {}

  ngOnInit(): void {
    // Subscribe to modal state from the modal service
    this.modalService.modalState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.isVisible = state.gettingStartedOpen;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hide(): void {
    this.modalService.closeGettingStarted();
    // Update preferences to not show welcome on startup
    const currentPreferences = this.preferencesService.currentPreferences;
    this.preferencesService.updatePreferencesLocal({ 
      ...currentPreferences, 
      showWelcomeOnStartup: false 
    });
  }
}
