import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IsAdminGuard implements CanActivate {
  constructor(private router : Router){}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot):  boolean {
      if (localStorage.getItem('userToken') != null && localStorage.getItem('user_id') != null){
        this.router.navigate(['/user/home']);
        return false;
      }
      else if (localStorage.getItem('companyToken') != null && localStorage.getItem('company_id') != null){
        this.router.navigate(['/company/home']);
        return false;
      }
      else if (localStorage.getItem('adminToken') != null && localStorage.getItem('admin_id') != null){
        return true;
      }else{
        this.router.navigate(['/visitor/news']);
        return false;
      }
      
  }
  
}
