import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-user',
  templateUrl: './login-user.component.html',
  styleUrls: ['./login-user.component.css']
})
export class LoginUserComponent implements OnInit {
  loginErrorMessage = "";
  isLoginError: boolean = false;
  isLoading: boolean = false;
  user = new User("student");

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // If already authenticated as student, redirect to home
    if (this.authService.isAuthenticated() && this.authService.getUserType() === 'student') {
      this.router.navigate(['/user/home']);
    }
  }

  loginUser() {
    // Validate inputs
    if (!this.user.email || !this.user.password) {
      this.isLoginError = true;
      this.loginErrorMessage = "Please enter both email and password";
      return;
    }

    this.isLoading = true;
    this.isLoginError = false;
    document.getElementById("submit-btn")?.setAttribute("disabled", "true");
    document.getElementById("submit-btn")?.setAttribute("style", "cursor: not-allowed! important;");

    // Use AuthService for login (handles HTTP-only cookies automatically)
    this.authService.login('student', {
      email: this.user.email,
      password: this.user.password
    }).subscribe(
      (data: any) => {
        this.isLoading = false;
        // Tokens are now stored in HTTP-only cookies (not accessible via JS)
        // Only user info is stored in localStorage
        this.router.navigate(['/user/home']);
      },
      (err: HttpErrorResponse) => {
        this.isLoading = false;
        document.getElementById("submit-btn")?.removeAttribute("disabled");
        document.getElementById("submit-btn")?.setAttribute("style", "cursor: pointer;");
        this.isLoginError = true;

        // Better error messages based on error type
        if (err.error && err.error.message) {
          this.loginErrorMessage = err.error.message;
        } else if (err.status === 0) {
          this.loginErrorMessage = "Unable to connect to server. Please check your network connection.";
        } else if (err.status === 401) {
          this.loginErrorMessage = "Invalid email or password. Please try again.";
        } else if (err.status === 404) {
          this.loginErrorMessage = "User not found. Please check your email address.";
        } else {
          this.loginErrorMessage = "An unexpected error occurred. Please try again later.";
        }
      }
    );
  }
}
