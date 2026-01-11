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
      const userType = localStorage.getItem('userType');
      const userId = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('company_id');
      const adminId = localStorage.getItem('admin_id');

      // Allow if logged in as student
      if (userType === 'student' && userId != null) {
        return true;
      }
      // Redirect to company home if logged in as company
      else if (userType === 'company' && companyId != null) {
        this.router.navigate(['/company/home']);
        return false;
      }
      // Redirect to admin home if logged in as admin
      else if (userType === 'admin' && adminId != null) {
        this.router.navigate(['/admin/home']);
        return false;
      }
      // Not logged in - redirect to visitor
      else {
        this.router.navigate(['/visitor/news']);
        return false;
      }
  }
  
}
