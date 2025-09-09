import { Injectable } from '@angular/core';
import { PreferencesService } from './preferences.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  constructor(private preferencesService: PreferencesService) {
    this.initializeTheme();
  }

  initializeTheme(): void {
    this.applyTheme(this.preferencesService.preferences.theme);
  }

  updateTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.applyTheme(theme);
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    
    let effectiveTheme = theme;
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      body.classList.add(`theme-${theme}`);
    }
    
    // Set Bootstrap theme attribute
    body.setAttribute('data-bs-theme', effectiveTheme);
  }
}
