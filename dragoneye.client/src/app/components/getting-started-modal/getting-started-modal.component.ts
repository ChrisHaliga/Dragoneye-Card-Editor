import { Component } from '@angular/core';
import { PreferencesService } from '../../services/preferences.service';

@Component({
  selector: 'app-getting-started-modal',
  templateUrl: './getting-started-modal.component.html',
  styleUrls: ['./getting-started-modal.component.css'],
  standalone: false
})
export class GettingStartedModalComponent {
  isVisible = false;

  constructor(private preferencesService: PreferencesService) {}

  show(): void {
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
    this.preferencesService.updatePreferences({ showWelcomeOnStartup: false });
  }
}
