import { Component } from '@angular/core';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  // Feature flag to switch between v1 and v2
  useV2 = true; // Set to true to use v2 architecture

  constructor(private themeService: ThemeService) {
    this.themeService.initializeTheme();
  }
}
