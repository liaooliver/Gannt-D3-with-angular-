import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { BarComponent } from './bar/bar.component';
import { TreeNodeComponent } from './tree-node/tree-node.component';
import { NodeItemComponent } from './node-item/node-item.component';

@NgModule({
  declarations: [
    AppComponent,
    BarComponent,
    TreeNodeComponent,
    NodeItemComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
