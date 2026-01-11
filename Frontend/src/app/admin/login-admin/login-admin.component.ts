import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Admin } from '../models/admin.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-admin',
  templateUrl: './login-admin.component.html',
  styleUrls: ['./login-admin.component.css']
})
export class LoginAdminComponent implements OnInit {
  loginErrorMessage = "";
  isLoginError: boolean = false;
  isLoading: boolean = false;
  admin = new Admin();

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // If already authenticated as admin, redirect to home
    if (this.authService.isAuthenticated() && this.authService.getUserType() === 'admin') {
      this.router.navigate(['/admin/home']);
    }
  }

  loginAdmin() {
    if (!this.admin.email || !this.admin.password) {
      this.isLoginError = true;
      this.loginErrorMessage = "Please enter both email and password";
      return;
    }

    this.isLoading = true;
    this.isLoginError = false;
    document.getElementById("submit-btn")?.setAttribute("disabled", "true");
    document.getElementById("submit-btn")?.setAttribute("style", "cursor: not-allowed! important;");

    // Use AuthService for login (handles HTTP-only cookies automatically)
    this.authService.login('admin', {
      email: this.admin.email,
      password: this.admin.password
    }).subscribe(
      (data: any) => {
        this.isLoading = false;
        // Tokens are now stored in HTTP-only cookies (not accessible via JS)
        this.router.navigate(['/admin/home']);
      },
      (err: HttpErrorResponse) => {
        this.isLoading = false;
        document.getElementById("submit-btn")?.removeAttribute("disabled");
        document.getElementById("submit-btn")?.setAttribute("style", "cursor: pointer;");
        this.isLoginError = true;

        if (err.error && err.error.message) {
          this.loginErrorMessage = err.error.message;
        } else if (err.status === 0) {
          this.loginErrorMessage = "Unable to connect to server.";
        } else {
          this.loginErrorMessage = "Invalid credentials. Please try again.";
        }
      }
    );
  }
}
