import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileUserComponent } from './profile-user/profile-user.component';

import { IsUserGuard } from './guards/is-user.guard';
import { UserRoutes } from './user.routing';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserComponentsModule } from './user-components/user-components.module';
import { SearchUserComponent } from './search-user/search-user.component';
import { HomeUserComponent } from './home-user/home-user.component';
import { MapUserComponent } from './map-user/map-user.component';
import { DocumentsComponent } from './documents/documents.component';
import { ProgressBarModule } from 'angular-progress-bar';


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(UserRoutes),
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatRippleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    UserComponentsModule,
    ProgressBarModule
  ],
  declarations: [
    HomeUserComponent,
    ProfileUserComponent,
    SearchUserComponent,
    
    MapUserComponent,
    DocumentsComponent,
  ],
  providers: [IsUserGuard],
})
export class UserModule { }
