import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app.routing';
import { AppComponent } from './app.component';
import { AgmCoreModule } from '@agm/core';
import { VisitorComponent } from './visitor/visitor.component';
import { UserComponent } from './user/user.component';
import { CompanyComponent } from './company/company.component';
import { IsVisitorGuard } from './visitor/guards/is-visitor.guard';
import { VisitorComponentsModule } from './visitor/visitor-components/visitor-components.module';
import { UserComponentsModule } from './user/user-components/user-components.module';
import { CompanyComponentsModule } from './company/company-components/company-components.module';
import { IsUserGuard } from './user/guards/is-user.guard';
import { IsCompanyGuard } from './company/guards/is-company.guard';
import { AdminComponent } from './admin/admin.component';
import { AdminComponentsModule } from './admin/admin-components/admin-components.module';
import { LoginAdminComponent } from './admin/login-admin/login-admin.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MapUserComponent } from './user/map-user/map-user.component';


@NgModule({
  imports: [
    VisitorComponentsModule,
    UserComponentsModule,
    CompanyComponentsModule,
    AdminComponentsModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    MatButtonModule,
    MatRippleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    AgmCoreModule.forRoot()
  ],

  declarations: [
    AppComponent,
    VisitorComponent,
    UserComponent,
    CompanyComponent,
    AdminComponent,
    LoginAdminComponent,
  ],
  providers: [IsVisitorGuard, IsUserGuard, IsCompanyGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
