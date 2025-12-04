import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutes } from './admin.routing';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminComponentsModule } from './admin-components/admin-components.module';
import { LoginAdminComponent } from './login-admin/login-admin.component';
import { SearchAdminComponent } from './search-admin/search-admin.component';
import { HomeAdminComponent } from './home-admin/home-admin.component';
import { SendEmailComponent } from './send-email/send-email.component';
import { AddUsersComponent } from './add-users/add-users.component';
import { MapAdminComponent } from './map-admin/map-admin.component';
import { DocumentsComponent } from './documents/documents.component';
import { MessagesComponent } from './messages/messages.component';
import { ProgressBarModule } from 'angular-progress-bar';



@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminRoutes),
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatRippleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    AdminComponentsModule,
    ProgressBarModule
  ],
  declarations: [
  SearchAdminComponent,
  HomeAdminComponent,
  SendEmailComponent,
  AddUsersComponent,
  MapAdminComponent,
  DocumentsComponent,
  MessagesComponent,
  ],
  providers: [],
})
export class AdminModule { }
