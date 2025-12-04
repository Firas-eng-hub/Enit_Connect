import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Admin } from '../models/admin.model';
import { LoginAdminService } from '../services/login-admin.service';

@Component({
  selector: 'app-login-admin',
  templateUrl: './login-admin.component.html',
  styleUrls: ['./login-admin.component.css']
})
export class LoginAdminComponent implements OnInit {
  loginErrorMessage = "";
  isLoginError : boolean = false;
  admin = new Admin();
  
  constructor(private loginAdminService : LoginAdminService, private router : Router) { }

  loginAdmin(){
    console.log(this.admin);
    document.getElementById("submit-btn").setAttribute("disabled","true");
    document.getElementById("submit-btn").setAttribute("style","cursor: not-allowed! important;");

    this.loginAdminService.loginUser(this.admin).subscribe((data : any)=>{
      localStorage.setItem('adminToken',data.accessToken);
      localStorage.setItem('admin_id',data.id);
      localStorage.setItem('name',data.name);
      this.router.navigate(['/admin/home']);
   },
   (err : HttpErrorResponse)=>{
    document.getElementById("submit-btn").removeAttribute("disabled");
    document.getElementById("submit-btn").setAttribute("style","cursor: pointer;");
     this.isLoginError = true;
     this.loginErrorMessage = err.error.message;
   });
   
 }

 ngOnInit(): void {
    
}

}
