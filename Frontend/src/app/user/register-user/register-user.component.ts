import { HttpClient, HttpErrorResponse, HttpHeaders, JsonpClientBackend } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { User } from '../models/user.model';
import { RegisterUserService } from '../services/register-user.service';



@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css']
})
export class RegisterUserComponent implements OnInit {

  user = new User("student");
  page = "register";
  type = "student";
  date = new Date();
  years = [];
  errorMessage = "";
  validationError = false;
  validationErrorMessage = "";
  classes = [
    "1st CS 1",
    "1st CS 2",
    "1st CS 3",
    "2nd CS 1",
    "2nd CS 2",
    "2nd CS 3",
    "3rd CS 1",
    "3rd CS 2",
    "3rd CS 3",
    "1st Tel 1",
    "1st Tel 2",
    "1st Tel 3",
    "2nd Tel 1",
    "2nd Tel 2",
    "2nd Tel 3",
    "3rd Tel 1",
    "3rd Tel 2",
    "3rd Tel 3"
  ];
  constructor(private registerUserService: RegisterUserService) {
    this.page = "register";
  }

  ngOnInit(): void {
    let i = 0;
    for (i = 2000; i < this.date.getFullYear() + 5; i++) {
      this.years.push(i + "");
    }
  }

  validateForm(): boolean {
    this.validationError = false;
    this.validationErrorMessage = "";

    if (!this.user.firstname || this.user.firstname.trim() === '') {
      this.validationErrorMessage = "First name is required";
      this.validationError = true;
      return false;
    }
    if (!this.user.lastname || this.user.lastname.trim() === '') {
      this.validationErrorMessage = "Last name is required";
      this.validationError = true;
      return false;
    }
    if (!this.user.email || this.user.email.trim() === '') {
      this.validationErrorMessage = "Email address is required";
      this.validationError = true;
      return false;
    }
    if (!this.user.email.includes('@')) {
      this.validationErrorMessage = "Please enter a valid email address";
      this.validationError = true;
      return false;
    }
    if (!this.user.password || this.user.password.length < 6) {
      this.validationErrorMessage = "Password must be at least 6 characters";
      this.validationError = true;
      return false;
    }
    return true;
  }

  registerUser() {
    // Validate form first
    if (!this.validateForm()) {
      return;
    }

    this.user.type = this.type;
    document.getElementById("submit-btn").setAttribute("disabled", "true");
    document.getElementById("submit-btn").setAttribute("style", "cursor: not-allowed! important;");
    this.registerUserService.registerUser(this.user).subscribe((data: any) => {
      this.page = "success";
      console.log(data);
    },
      (err: HttpErrorResponse) => {
        document.getElementById("submit-btn").removeAttribute("disabled");
        document.getElementById("submit-btn").setAttribute("style", "cursor: pointer;");
        this.page = "error";
        // Extract error message from response
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else if (err.status === 0) {
          this.errorMessage = "Unable to connect to server. Please check your internet connection.";
        } else if (err.status === 400) {
          this.errorMessage = "Invalid registration data. Please check your information.";
        } else if (err.status === 409) {
          this.errorMessage = "This email address is already registered.";
        } else {
          this.errorMessage = "An unexpected error occurred. Please try again later.";
        }
        console.log(err);
      });
    console.log(this.user);
  }

}

