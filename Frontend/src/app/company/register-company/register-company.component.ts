import { HttpClient, HttpErrorResponse, JsonpClientBackend } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Company } from '../models/company.model';
import { RegisterCompanyService } from '../services/register-company.service';
@Component({
  selector: 'app-register-company',
  templateUrl: './register-company.component.html',
  styleUrls: ['./register-company.component.css']
})
export class RegisterCompanyComponent implements OnInit {


  company = new Company();
  page = "register";
  
  constructor(private registerCompanyService : RegisterCompanyService) {
    this.page = "register";
  }

  ngOnInit(): void {
  }

  registerCompany(){
    document.getElementById("submit-btn").setAttribute("disabled","true");
    document.getElementById("submit-btn").setAttribute("style","cursor: not-allowed! important;");
    this.registerCompanyService.registerCompany(this.company).subscribe((data : any)=>{
      this.page = "success";
      console.log(data);
   },
   (err : HttpErrorResponse)=>{
    document.getElementById("submit-btn").removeAttribute("disabled");
    document.getElementById("submit-btn").setAttribute("style","cursor: pointer;");
    this.page = "error";
     console.log(err);
   });
    console.log(this.company);
  }

}
