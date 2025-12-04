import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Company } from '../models/company.model';
import { LoginCompanyService } from '../services/login-company.service';

@Component({
  selector: 'app-login-company',
  templateUrl: './login-company.component.html',
  styleUrls: ['./login-company.component.css']
})
export class LoginCompanyComponent implements OnInit {

  company = new Company();
  
  isLoginError : boolean = false;
  constructor(private loginCompanyService : LoginCompanyService, private router : Router) { }

  
  ngOnInit(): void {
    
  }

  loginCompany(){
    console.log(this.company);
    document.getElementById("submit-btn").setAttribute("disabled","true");
    document.getElementById("submit-btn").setAttribute("style","cursor: not-allowed! important;");
    this.loginCompanyService.loginCompany(this.company).subscribe((data : any)=>{
      localStorage.setItem('companyToken',data.accessToken);
      localStorage.setItem('company_id',data.id);
      //window.location.replace('/company/home');
      this.router.navigate(['/company/home']);
   },
   (err : HttpErrorResponse)=>{
     console.log(err);
    document.getElementById("submit-btn").removeAttribute("disabled");
    document.getElementById("submit-btn").setAttribute("style","cursor: pointer;");
     this.isLoginError = true;
   });
   
 }

}
