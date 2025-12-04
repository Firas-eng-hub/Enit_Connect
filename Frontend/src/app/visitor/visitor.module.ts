import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RouterModule } from '@angular/router';
import { VisitorRoutes } from './visitor.routing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoginCompanyComponent } from 'app/company/login-company/login-company.component';
import { LoginUserComponent } from 'app/user/login-user/login-user.component';
import { RegisterCompanyComponent } from 'app/company/register-company/register-company.component';
import { RegisterUserComponent } from 'app/user/register-user/register-user.component';
import { VisitorComponentsModule } from './visitor-components/visitor-components.module';
import { NewsComponent } from './news/news.component';
import { MembersComponent } from './members/members.component';
import { AboutComponent } from './about/about.component';

@NgModule({
  declarations: [
    DashboardComponent,
    LoginCompanyComponent,
    LoginUserComponent,
    RegisterCompanyComponent,
    RegisterUserComponent,
    NewsComponent,
    MembersComponent,
    AboutComponent,
    
  ],
  imports: [
    VisitorComponentsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatRippleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    RouterModule.forChild(VisitorRoutes),
  ],
})
export class VisitorModule { }
