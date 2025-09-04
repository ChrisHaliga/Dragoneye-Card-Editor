import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CardEditorComponent } from './components/card-editor/card-editor.component';
import { CardDisplayComponent } from './components/card-display/card-display.component';
import { CardHierarchyComponent } from './components/card-hierarchy/card-hierarchy.component';
import { CardPropertiesComponent } from './components/card-properties/card-properties.component';
import { FileManagerModalComponent } from './components/file-manager-modal/file-manager-modal.component';
import { OverwriteConfirmationModalComponent } from './components/overwrite-confirmation-modal/overwrite-confirmation-modal.component';
import { GettingStartedModalComponent } from './components/getting-started-modal/getting-started-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    CardEditorComponent,
    CardDisplayComponent,
    CardHierarchyComponent,
    CardPropertiesComponent,
    FileManagerModalComponent,
    OverwriteConfirmationModalComponent,
    GettingStartedModalComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
