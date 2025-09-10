import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentThemeSubject = new BehaviorSubject<Theme>('light');
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  initializeTheme(): void {
    // Get saved theme or default to light
    const savedTheme = this.getSavedTheme();
    this.applyTheme(savedTheme);
    this.currentThemeSubject.next(savedTheme);

    // Listen for system theme changes if auto mode
    if (savedTheme === 'auto') {
      this.setupSystemThemeListener();
    }
  }

  setTheme(theme: Theme): void {
    localStorage.setItem('dragoneye-theme', theme);
    this.applyTheme(theme);
    this.currentThemeSubject.next(theme);

    if (theme === 'auto') {
      this.setupSystemThemeListener();
    }
  }

  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  getActualTheme(): 'light' | 'dark' {
    const currentTheme = this.getCurrentTheme();
    if (currentTheme === 'auto') {
      return this.getSystemTheme();
    }
    return currentTheme;
  }

  toggleTheme(): void {
    const current = this.getCurrentTheme();
    const next = current === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  private getSavedTheme(): Theme {
    const saved = localStorage.getItem('dragoneye-theme') as Theme;
    return saved || 'light';
  }

  private applyTheme(theme: Theme): void {
    const actualTheme = theme === 'auto' ? this.getSystemTheme() : theme;
    
    // Remove existing theme classes
    this.renderer.removeClass(document.body, 'theme-light');
    this.renderer.removeClass(document.body, 'theme-dark');
    
    // Apply new theme class to body
    this.renderer.addClass(document.body, `theme-${actualTheme}`);
    
    // Set Bootstrap data-bs-theme attribute
    this.renderer.setAttribute(document.documentElement, 'data-bs-theme', actualTheme);
    
    // Set custom data-theme attribute for our CSS variables
    this.renderer.setAttribute(document.documentElement, 'data-theme', actualTheme);
    
    console.log(`Applied theme: ${actualTheme} (from ${theme})`);
  }

  private getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  private setupSystemThemeListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        if (this.getCurrentTheme() === 'auto') {
          this.applyTheme('auto');
        }
      };

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
      }
    }
  }
}
