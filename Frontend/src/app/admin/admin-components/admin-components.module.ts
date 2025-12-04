import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminFooterComponent } from './admin-footer/admin-footer.component';
import { AdminNavbarComponent } from './admin-navbar/admin-navbar.component';
import { AdminSidebarComponent } from './admin-sidebar/admin-sidebar.component';



@NgModule({
  imports: [
    CommonModule,
    RouterModule,
  ],
  declarations: [
    AdminFooterComponent,
    AdminNavbarComponent,
    AdminSidebarComponent
  ],
  exports: [
    AdminFooterComponent,
    AdminNavbarComponent,
    AdminSidebarComponent
  ]
})
export class AdminComponentsModule { }
