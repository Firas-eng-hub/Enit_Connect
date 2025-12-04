import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VisitorFooterComponent } from './visitor-footer/visitor-footer.component';
import { VisitorNavbarComponent } from './visitor-navbar/visitor-navbar.component';
import { VisitorSidebarComponent } from './visitor-sidebar/visitor-sidebar.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,

  ],
  declarations: [
    VisitorFooterComponent,
    VisitorNavbarComponent,
    VisitorSidebarComponent,
  ],
  exports: [
    VisitorFooterComponent,
    VisitorNavbarComponent,
    VisitorSidebarComponent
  ]
})
export class VisitorComponentsModule { }
