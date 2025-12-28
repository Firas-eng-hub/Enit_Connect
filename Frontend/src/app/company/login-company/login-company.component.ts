import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Company } from '../models/company.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-company',
  templateUrl: './login-company.component.html',
  styleUrls: ['./login-company.component.css']
})
export class LoginCompanyComponent implements OnInit {
  company = new Company();
  isLoginError: boolean = false;
  isLoading: boolean = false;
  loginErrorMessage = "";

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // If already authenticated as company, redirect to home
    if (this.authService.isAuthenticated() && this.authService.getUserType() === 'company') {
      this.router.navigate(['/company/home']);
    }
  }

  loginCompany() {
    if (!this.company.email || !this.company.password) {
      this.isLoginError = true;
      this.loginErrorMessage = "Please enter both email and password";
      return;
    }

    this.isLoading = true;
    this.isLoginError = false;
    document.getElementById("submit-btn")?.setAttribute("disabled", "true");
    document.getElementById("submit-btn")?.setAttribute("style", "cursor: not-allowed! important;");

    // Use AuthService for login (handles HTTP-only cookies automatically)
    this.authService.login('company', {
      email: this.company.email,
      password: this.company.password
    }).subscribe(
      (data: any) => {
        this.isLoading = false;
        // Tokens are now stored in HTTP-only cookies (not accessible via JS)
        this.router.navigate(['/company/home']);
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
