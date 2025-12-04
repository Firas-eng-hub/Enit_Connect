import { NgModule } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { BrowserModule  } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';
import { VisitorComponent } from './visitor/visitor.component';
import { UserComponent } from './user/user.component';
import { CompanyComponent } from './company/company.component';
import { IsCompanyGuard } from './company/guards/is-company.guard';
import { IsUserGuard } from './user/guards/is-user.guard';
import { IsVisitorGuard } from './visitor/guards/is-visitor.guard';
import { IsAdminGuard } from './admin/guards/is-admin.guard';
import { AdminComponent } from './admin/admin.component';
import { LoginAdminComponent } from './admin/login-admin/login-admin.component';


export const routes: Routes = [
  
  {
    path: '',
    redirectTo: 'visitor/news',
    pathMatch: 'full',
  },{
    path: 'visitor',
    component: VisitorComponent,
    children: [{
      path: '',
      loadChildren: './visitor/visitor.module#VisitorModule'
    }],
    canActivate : [IsVisitorGuard]
  },{
    path: 'user',
    component: UserComponent,
    children: [{
      path: '',
      loadChildren: './user/user.module#UserModule'
    }],
    canActivate : [IsUserGuard]
  },{
    path: 'company',
    component: CompanyComponent,
    children: [{
      path: '',
      loadChildren: './company/company.module#CompanyModule'
    }],
    canActivate : [IsCompanyGuard]
  }
  ,{path: 'admin/login', component: LoginAdminComponent, canActivate : [IsVisitorGuard]}
  ,{
    path: 'admin',
    component: AdminComponent,
    children: [{
      path: '',
      loadChildren: './admin/admin.module#AdminModule'
    }],
    canActivate : [IsAdminGuard]
  }
];


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(routes)
  ],
  exports: [],
})
export class AppRoutingModule { }
