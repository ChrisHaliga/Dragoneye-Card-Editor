import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ModalService } from '../../../features/ui-state/services/modal.service';

@Component({
  selector: 'app-about-modal-v2',
  templateUrl: './about-modal.component.html',
  styleUrls: ['./about-modal.component.css'],
  standalone: false
})
export class AboutModalV2Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isVisible = false;

  constructor(private modalService: ModalService) {}

  ngOnInit(): void {
    // Subscribe to modal state from the modal service
    this.modalService.modalState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.isVisible = state.aboutOpen;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hide(): void {
    this.modalService.closeAbout();
  }

  openGitHub(): void {
    window.open('https://github.com/ChrisHaliga/Dragoneye', '_blank');
  }

  openIssues(): void {
    window.open('https://github.com/ChrisHaliga/Dragoneye/issues', '_blank');
  }

  openLinkedIn(): void {
    window.open('https://www.linkedin.com/in/chrishaliga/', '_blank');
  }
}
