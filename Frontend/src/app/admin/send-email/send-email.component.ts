import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Email } from '../models/email.model';

@Component({
  selector: 'app-send-email',
  templateUrl: './send-email.component.html',
  styleUrls: ['./send-email.component.css']
})
export class SendEmailComponent implements OnInit {
  email = new Email();
  addresses = [];
  page = "send";
  constructor(private http : HttpClient) { }

  ngOnInit(): void {
    if(localStorage.getItem("addresses") != undefined){
      this.addresses = JSON.parse(localStorage.getItem("addresses"));
    }
    if(this.addresses.length == 0){
      this.addresses.push('');
    }
    localStorage.removeItem("addresses");
  }

  sendEmail(){
    this.email.emails = this.addresses;
    console.log(this.email);
    document.getElementById("submit-btn").setAttribute("disabled","true");
    document.getElementById("submit-btn").setAttribute("style","cursor: not-allowed! important;");
    
    this.http.post(`${environment.apiUrl}/api/admin/contact`,this.email).subscribe((data : any)=>{
      console.log(data);
      this.page = "success";
      this.addresses = [];
      this.email.message = "";
      this.email.object = "";
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
    this.page  = "error";
   });
  }

  remove(i){
    this.addresses.splice(i, 1); 
  }

}
