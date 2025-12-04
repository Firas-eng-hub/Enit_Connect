import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { LoginUserService } from '../services/login-user.service';

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
  constructor(private loginUserService: LoginUserService, private router: Router) { }


  ngOnInit(): void {

  }

  loginUser() {
    // Validate inputs
    if (!this.user.email || !this.user.password) {
      this.isLoginError = true;
      this.loginErrorMessage = "Please enter both email and password";
      return;
    }

    console.log(this.user);
    this.isLoading = true;
    this.isLoginError = false;
    document.getElementById("submit-btn").setAttribute("disabled", "true");
    document.getElementById("submit-btn").setAttribute("style", "cursor: not-allowed! important;");

    this.loginUserService.loginUser(this.user).subscribe((data: any) => {
      this.isLoading = false;
      localStorage.setItem('userToken', data.accessToken);
      localStorage.setItem('user_id', data.id);
      localStorage.setItem('name', data.name);
      //window.location.replace('/user/home');
      this.router.navigate(['/user/home']);
    },
      (err: HttpErrorResponse) => {
        this.isLoading = false;
        document.getElementById("submit-btn").removeAttribute("disabled");
        document.getElementById("submit-btn").setAttribute("style", "cursor: pointer;");
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
      });

  }

}

