import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeCompanyComponent } from './home-company/home-company.component';
import { ProfileCompanyComponent } from './profile-company/profile-company.component';
import { SearchCompanyComponent } from './search-company/search-company.component';
import { IsCompanyGuard } from './guards/is-company.guard';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompanyRoutes } from './company.routing';
import { CompanyComponentsModule } from './company-components/company-components.module';
import { EditProfileCompanyComponent } from './edit-profile-company/edit-profile-company.component';
import { ProgressBarModule } from 'angular-progress-bar';
import { CandidaciesComponent } from './candidacies/candidacies.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(CompanyRoutes),
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatRippleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    CompanyComponentsModule,
    ProgressBarModule
  ],
  declarations: [
    HomeCompanyComponent,
    ProfileCompanyComponent,
    SearchCompanyComponent,
    EditProfileCompanyComponent,
    CandidaciesComponent,
    

  ],
  providers: [IsCompanyGuard],
})
export class CompanyModule { }
