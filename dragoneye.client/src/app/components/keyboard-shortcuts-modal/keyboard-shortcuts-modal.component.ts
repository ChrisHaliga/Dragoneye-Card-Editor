import { Component } from '@angular/core';

@Component({
  selector: 'app-keyboard-shortcuts-modal',
  templateUrl: './keyboard-shortcuts-modal.component.html',
  styleUrls: ['./keyboard-shortcuts-modal.component.css'],
  standalone: false
})
export class KeyboardShortcutsModalComponent {
  isVisible = false;

  show(): void {
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
  }
}
