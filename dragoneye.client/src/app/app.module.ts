import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

// V1 Components (keeping during transition)
import { CardEditorComponent } from './components/card-editor/card-editor.component';
import { CardDisplayComponent } from './components/card-display/card-display.component';
import { CardPropertiesComponent } from './components/card-properties/card-properties.component';
import { CardHierarchyComponent } from './components/card-hierarchy/card-hierarchy.component';
import { FileManagerModalComponent } from './components/file-manager-modal/file-manager-modal.component';
import { OverwriteConfirmationModalComponent } from './components/overwrite-confirmation-modal/overwrite-confirmation-modal.component';
import { GettingStartedModalComponent } from './components/getting-started-modal/getting-started-modal.component';
import { PreferencesModalComponent } from './components/preferences-modal/preferences-modal.component';
import { SaveAsModalComponent } from './components/save-as-modal/save-as-modal.component';
import { DeleteConfirmationModalComponent } from './components/delete-confirmation-modal/delete-confirmation-modal.component';
import { KeyboardShortcutsModalComponent } from './components/keyboard-shortcuts-modal/keyboard-shortcuts-modal.component';

// V2 Components - 100% Independent
import { CardEditorContainerComponent } from './v2/components/containers/card-editor-container/card-editor-container.component';
import { CardGroupComponent } from './v2/components/ui/card-group/card-group.component';
import { CardDisplayComponent as CardDisplayV2Component } from './v2/components/ui/card-display/card-display.component';
import { SelectionBoundsComponent } from './v2/components/ui/selection-bounds/selection-bounds.component';
import { NotificationContainerComponent } from './v2/components/ui/notification-container/notification-container.component';
import { ContextMenuComponent } from './v2/components/ui/context-menu/context-menu.component';
import { DeleteConfirmationModalV2Component } from './v2/components/ui/delete-confirmation-modal/delete-confirmation-modal.component';

// V2 Modal Components - 100% Independent
import { FileManagerModalComponent as FileManagerModalV2Component } from './v2/components/modals/file-manager-modal/file-manager-modal.component';
import { SaveAsModalComponent as SaveAsModalV2Component } from './v2/components/modals/save-as-modal/save-as-modal.component';
import { PreferencesModalComponent as PreferencesModalV2Component } from './v2/components/modals/preferences-modal/preferences-modal.component';
import { CardEditModalComponent } from './v2/components/modals/card-edit-modal/card-edit-modal.component';
import { GettingStartedModalV2Component } from './v2/components/modals/getting-started-modal/getting-started-modal.component';
import { KeyboardShortcutsModalV2Component } from './v2/components/modals/keyboard-shortcuts-modal/keyboard-shortcuts-modal.component';
import { AboutModalV2Component } from './v2/components/modals/about-modal/about-modal.component';

// V2 Repository Providers - using concrete classes and interface tokens
import { CardApiRepository } from './v2/core/repositories/http/card-api.repository';
import { FileApiRepository } from './v2/core/repositories/http/file-api.repository';
import { PreferencesApiRepository } from './v2/core/repositories/http/preferences-api.repository';

// Injection tokens for interfaces
export const CARD_API_REPOSITORY_TOKEN = Symbol('ICardApiRepository');
export const FILE_API_REPOSITORY_TOKEN = Symbol('IFileApiRepository');
export const PREFERENCES_API_REPOSITORY_TOKEN = Symbol('IPreferencesApiRepository');

@NgModule({
  declarations: [
    AppComponent,

    // V1 Components (keeping during transition)
    CardEditorComponent,
    CardDisplayComponent,
    CardPropertiesComponent, // Still needed for V1
    CardHierarchyComponent,
    FileManagerModalComponent,
    OverwriteConfirmationModalComponent,
    GettingStartedModalComponent,
    PreferencesModalComponent,
    SaveAsModalComponent,
    DeleteConfirmationModalComponent,
    KeyboardShortcutsModalComponent,

    // V2 Components - 100% Independent from V1
    CardEditorContainerComponent,
    CardGroupComponent,
    CardDisplayV2Component,
    SelectionBoundsComponent,
    NotificationContainerComponent,
    ContextMenuComponent,
    DeleteConfirmationModalV2Component,

    // V2 Modal Components - 100% Independent from V1
    FileManagerModalV2Component,
    SaveAsModalV2Component,
    PreferencesModalV2Component,
    CardEditModalComponent, // Now completely V2-only!
    GettingStartedModalV2Component,
    KeyboardShortcutsModalV2Component,
    AboutModalV2Component
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    // V2 Repository Providers - concrete classes for direct injection
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
