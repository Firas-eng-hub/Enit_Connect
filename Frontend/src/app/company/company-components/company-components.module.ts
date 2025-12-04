import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompanyFooterComponent } from './company-footer/company-footer.component';
import { CompanyNavbarComponent } from './company-navbar/company-navbar.component';
import { CompanySidebarComponent } from './company-sidebar/company-sidebar.component';



@NgModule({
  imports: [
    CommonModule,
    RouterModule,
  ],
  declarations: [
    CompanyFooterComponent,
    CompanyNavbarComponent,
    CompanySidebarComponent
  ],
  exports: [
    CompanyFooterComponent,
    CompanyNavbarComponent,
    CompanySidebarComponent
  ]
})
export class CompanyComponentsModule { }
