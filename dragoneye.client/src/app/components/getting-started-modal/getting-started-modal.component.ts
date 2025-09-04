import { Component } from '@angular/core';

@Component({
  selector: 'app-getting-started-modal',
  templateUrl: './getting-started-modal.component.html',
  styleUrls: ['./getting-started-modal.component.css'],
  standalone: false
})
export class GettingStartedModalComponent {
  public isVisible = false;

  public show(): void {
    this.isVisible = true;
  }

  public hide(): void {
    this.isVisible = false;
  }
}
