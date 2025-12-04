import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class IsUserGuard implements CanActivate {
  constructor(private router : Router){}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot):  boolean {
      if (localStorage.getItem('userToken') != null && localStorage.getItem('user_id') != null){
        return true;
      }
      else if (localStorage.getItem('companyToken') != null && localStorage.getItem('company_id') != null){
        this.router.navigate(['/company/home']);
        return false;
      }
      else if (localStorage.getItem('adminToken') != null && localStorage.getItem('admin_id') != null){
        this.router.navigate(['/admin/home']);
        return false;
      }else{
        this.router.navigate(['/visitor/news']);
        return false;
      }
      
  }
  
}
