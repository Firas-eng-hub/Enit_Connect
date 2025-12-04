import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserFooterComponent } from './user-footer/user-footer.component';
import { UserNavbarComponent } from './user-navbar/user-navbar.component';
import { UserSidebarComponent } from './user-sidebar/user-sidebar.component';



@NgModule({
  imports: [
    CommonModule,
    RouterModule,
  ],
  declarations: [
    UserFooterComponent,
    UserNavbarComponent,
    UserSidebarComponent
  ],
  exports: [
    UserFooterComponent,
    UserNavbarComponent,
    UserSidebarComponent
  ]
})
export class UserComponentsModule { }
