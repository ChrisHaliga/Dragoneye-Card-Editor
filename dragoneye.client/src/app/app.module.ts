import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

// Components
import { CardEditorContainerComponent } from './components/containers/card-editor-container/card-editor-container.component';
import { CardGroupComponent } from './components/ui/card-group/card-group.component';
import { CardDisplayComponent } from './components/ui/card-display/card-display.component';
import { SelectionBoundsComponent } from './components/ui/selection-bounds/selection-bounds.component';
import { NotificationContainerComponent } from './components/ui/notification-container/notification-container.component';
import { ContextMenuComponent } from './components/ui/context-menu/context-menu.component';
import { DeleteConfirmationModalComponent } from './components/ui/delete-confirmation-modal/delete-confirmation-modal.component';

// Modal Components
import { FileManagerModalComponent } from './components/modals/file-manager-modal/file-manager-modal.component';
import { SaveAsModalComponent } from './components/modals/save-as-modal/save-as-modal.component';
import { PreferencesModalComponent } from './components/modals/preferences-modal/preferences-modal.component';
import { CardEditModalComponent } from './components/modals/card-edit-modal/card-edit-modal.component';
import { RenameGroupModalComponent } from './components/modals/rename-group-modal/rename-group-modal.component';
import { GettingStartedModalComponent } from './components/modals/getting-started-modal/getting-started-modal.component';
import { KeyboardShortcutsModalComponent } from './components/modals/keyboard-shortcuts-modal/keyboard-shortcuts-modal.component';
import { AboutModalComponent } from './components/modals/about-modal/about-modal.component';

// Repository Providers - using concrete classes and interface tokens
import { CardApiRepository } from './core/repositories/http/card-api.repository';
import { FileApiRepository } from './core/repositories/http/file-api.repository';
import { PreferencesApiRepository } from './core/repositories/http/preferences-api.repository';

// Injection tokens for interfaces
export const CARD_API_REPOSITORY_TOKEN = Symbol('ICardApiRepository');
export const FILE_API_REPOSITORY_TOKEN = Symbol('IFileApiRepository');
export const PREFERENCES_API_REPOSITORY_TOKEN = Symbol('IPreferencesApiRepository');

@NgModule({
  declarations: [
    AppComponent,

    // Components
    CardEditorContainerComponent,
    CardGroupComponent,
    CardDisplayComponent,
    SelectionBoundsComponent,
    NotificationContainerComponent,
    ContextMenuComponent,
    DeleteConfirmationModalComponent,

    // Modal Components
    FileManagerModalComponent,
    SaveAsModalComponent,
    PreferencesModalComponent,
    CardEditModalComponent,
    RenameGroupModalComponent,
    GettingStartedModalComponent,
    KeyboardShortcutsModalComponent,
    AboutModalComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    // Repository Providers - concrete classes for direct injection
    CardApiRepository,
    FileApiRepository,
    PreferencesApiRepository,
    
    // Interface providers using injection tokens
    { provide: CARD_API_REPOSITORY_TOKEN, useClass: CardApiRepository },
    { provide: FILE_API_REPOSITORY_TOKEN, useClass: FileApiRepository },
    { provide: PREFERENCES_API_REPOSITORY_TOKEN, useClass: PreferencesApiRepository }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
