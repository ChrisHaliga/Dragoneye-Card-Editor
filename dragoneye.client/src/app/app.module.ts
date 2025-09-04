import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CardEditorComponent } from './components/card-editor/card-editor.component';
import { CardDisplayComponent } from './components/card-display/card-display.component';
import { CardHierarchyComponent } from './components/card-hierarchy/card-hierarchy.component';
import { CardPropertiesComponent } from './components/card-properties/card-properties.component';

@NgModule({
  declarations: [
    AppComponent,
    CardEditorComponent,
    CardDisplayComponent,
    CardHierarchyComponent,
    CardPropertiesComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
