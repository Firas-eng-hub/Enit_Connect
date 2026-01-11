import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {

  messages = [];
  empty = false;
  constructor(private http : HttpClient,private router: Router) { }

  ngOnInit(): void {
    this.getMessages();
  }

  reply(email : string){
    localStorage.setItem("addresses",JSON.stringify([email]));
    this.router.navigate(["/admin/send"]);
  }
  deleteMessage(id : string){
    
    this.http.delete(`${environment.apiUrl}/api/admin/message/`+ id).subscribe((data : any)=>{
     console.log(data);
      this.getMessages();
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
   });
}

  getMessages(){
    
    
    this.http.get(`${environment.apiUrl}/api/admin/message`).subscribe((data : any)=>{
     console.log(data);
      this.messages = data;
      if(this.messages.length == 0){
        this.empty = true;
      }else{
        this.empty = false;
      }
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
   });
   document.getElementById("notifmessage").setAttribute("style","display: none;");
  }
  
}
