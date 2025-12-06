import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from 'app/user/models/user.model';
import { Offer } from '../models/offer.model';


@Component({
  selector: 'app-candidacies',
  templateUrl: './candidacies.component.html',
  styleUrls: ['./candidacies.component.css']
})
export class CandidaciesComponent implements OnInit {

  constructor(private route : ActivatedRoute, private http : HttpClient) { }

  ngOnInit(): void {
    this.getCandidacies();
  }
  
  offer : Offer = new Offer();
  candidacies = [];
  user : User = new User("student");
  picture = "../../../assets/img/profil.png";
  public getCandidacies(){
    var id = "";
    this.route.paramMap.subscribe(param => {
      id = param.get('id');
    });
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("companyToken")});
    this.http.get(`${environment.apiUrl}/offers/candidacies?id=`+id ,{ headers: reqHeader }).subscribe((data : any) => {
      this.candidacies = data.candidacies;
      this.offer = data;
      console.log(this.offer);
    },
    (err : HttpErrorResponse)=>{
    console.log(err);
    });
  }
  public getUserInfo(id : string){
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("companyToken")});
    this.http.get(`${environment.apiUrl}/company/user/`+id ,{ headers: reqHeader }).subscribe((data : any) => {
      this.user = data;
      if(data.picture != ""){
        this.picture = data.picture;
      }
      console.log(this.user);
    },
    (err : HttpErrorResponse)=>{
    console.log(err);
    });
  }

  public togglePopup(){
    //this.popup = 'home';
    document.getElementById("popup").classList.toggle("active");
  }

}
