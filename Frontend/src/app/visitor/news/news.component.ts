import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {

  constructor(private http : HttpClient) { }

  ngOnInit(): void {
    this.getNews();
    /*var counter = 1;
  setInterval(function(){
    document.getElementById('radio' + counter).setAttribute("checked" , "true");
    counter++;
    if(counter > 4){
      counter = 1;
    }
  }, 5000);*/
  }
  news = [];
  page = "send";
  message = {
    name : "",
    email : "",
    message : "",
    date : "",
    lu : false
  };
  erreur1 = false;
  public popup = 'home';
  public togglePopup(){
    this.popup = 'home';
    document.getElementById("popup-1").classList.toggle("active");
  }
  public createUserAccount(){
    this.popup = 'createUserAccount';
  }
  public createCompanyAccount(){
    this.popup = 'createCompanyAccount';
  }
  public loginCompany(){
    this.popup = 'loginCompany';
  }
  sendEmail(){
    if(this.message.name == "" || this.message.email == "" || this.message.message == "" ){
      this.erreur1 = true;
    }else{
      var dateObj = new Date();
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var day = dateObj.getUTCDate();
        var year = dateObj.getUTCFullYear();

        this.message.date = day + "/" + month + "/" + year;
      
      this.http.post("http://localhost:3000/admin/message", this.message ).subscribe((data : any)=>{
        console.log(data);
        this.message = {
          name : "",
          email : "",
          message : "",
          date : "",
          lu : false
        };
        this.page = "success";
     },
     (err : HttpErrorResponse)=>{
      console.log(err);
     });  
    }

  }

  getNews(){
    this.http.get("http://localhost:3000/admin/news").subscribe((data : any) => {
      this.news = data;
      console.log(this.news);
    },
    (err : HttpErrorResponse)=>{
    console.log(err);
    });
  }
}
