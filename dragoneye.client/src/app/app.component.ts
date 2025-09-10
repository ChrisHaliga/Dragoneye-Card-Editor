import { Component, OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  
  constructor(private themeService: ThemeService) {
  }

  ngOnInit(): void {
    // Initialize theme system
    this.themeService.initializeTheme();
  }
}
