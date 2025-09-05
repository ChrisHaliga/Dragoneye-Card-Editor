import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
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

@NgModule({
  declarations: [
    AppComponent,
    CardEditorComponent,
    CardDisplayComponent,
    CardPropertiesComponent,
    CardHierarchyComponent,
    FileManagerModalComponent,
    OverwriteConfirmationModalComponent,
    GettingStartedModalComponent,
    PreferencesModalComponent,
    SaveAsModalComponent,
    DeleteConfirmationModalComponent,
    KeyboardShortcutsModalComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
