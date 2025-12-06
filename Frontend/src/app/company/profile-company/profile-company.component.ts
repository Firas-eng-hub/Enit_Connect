import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Company } from '../models/company.model';

@Component({
  selector: 'app-profile-company',
  templateUrl: './profile-company.component.html',
  styleUrls: ['./profile-company.component.css']
})
export class ProfileCompanyComponent implements OnInit {

  
  readonly url = `${environment.apiUrl}/company/`;
  constructor(private http : HttpClient) { }
  company = new Company();
  page = "profile";
  picture = "./assets/img/companyprofil.png";
  ngOnInit() {
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("companyToken")});
    this.http.get(`${environment.apiUrl}/company/info?id=`+localStorage.getItem("company_id"), { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
      this.company.name =data.name;
      this.company.email =data.email;
      this.company.country =data.country;
      this.company.city =data.city;
      this.company.address =data.address;
      this.company.website =data.website;
      this.company.phone =data.phone;
      this.company.about =data.about;
      if(data.logo && data.logo != ""){
        this.picture = data.logo;
      }
      
   },
   (err : HttpErrorResponse)=>{
     console.log(err);
   });
    
  }

  updateProfile(){
    console.log(this.company);
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("companyToken")});
    this.http.patch(`${environment.apiUrl}/company/update?id=`+localStorage.getItem("company_id"),this.company, { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
      
      this.page = "profile";
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
    this.page = "profile";
   });
  }

  cancel(){
    this.page = "profile";
  }

}
