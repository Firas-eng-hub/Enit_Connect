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
      const userType = localStorage.getItem('userType');
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const adminId = localStorage.getItem('admin_id');

      // Redirect to user home if logged in as student
      if (userType === 'student' && userId != null) {
        this.router.navigate(['/user/home']);
        return false;
      }
      // Redirect to company home if logged in as company
      else if (userType === 'company' && companyId != null) {
        this.router.navigate(['/company/home']);
        return false;
      }
      // Allow if logged in as admin
      else if (userType === 'admin' && adminId != null) {
        return true;
      }
      // Not logged in - redirect to visitor
      else {
        this.router.navigate(['/visitor/news']);
        return false;
      }
  }
  
}
