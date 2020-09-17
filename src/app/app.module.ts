import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { BarComponent } from './bar/bar.component';
import { TreeNodeComponent } from './tree-node/tree-node.component';
import { NodeItemComponent } from './node-item/node-item.component';
import { ZoomableComponent } from './zoomable/zoomable.component';

@NgModule({
  declarations: [
    AppComponent,
    BarComponent,
    TreeNodeComponent,
    NodeItemComponent,
    ZoomableComponent,
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
