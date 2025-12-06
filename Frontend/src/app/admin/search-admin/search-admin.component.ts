import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Company } from 'app/company/models/company.model';
import { User } from 'app/user/models/user.model';

@Component({
  selector: 'app-search-admin',
  templateUrl: './search-admin.component.html',
  styleUrls: ['./search-admin.component.css']
})
export class SearchAdminComponent implements OnInit {

  users: any;
  companies : any;
  property = "";
  key: string;
  entity = "";
  mode = "table";
  
  
  
  
  firstname : string;
  lastname : string;
  id : string;
  country : string;
  date = new Date();
  years = [];
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
  constructor(private http: HttpClient,private router: Router) {}

  ngOnInit() {
    this.users = []; // to prevent ngFor to throw while we wait for API to return data
    this.companies = [];
    //this.getAll();
    let i = 0;
    for(i=2000; i<this.date.getFullYear() + 5;i++){
      this.years.push(i+"");
    }
  }
  
  
  
 
  
  

  search(){
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
    this.http.get(`${environment.apiUrl}/admin/search/`+this.entity+"?property="+this.property+"&key="+this.key, { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
      if(this.entity =="student"){
        this.users = data;
      }else if(this.entity =="company"){
        this.companies = data;
      }
      
      this.addresses = [];
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
   });

  }
  getAllUsers(){
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
    this.http.get(`${environment.apiUrl}/admin/allstudents`, { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
      this.users = data;
      this.addresses = [];
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
    
   });
  }
  getAllCompanies(){
    this.addresses = [];
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
    this.http.get(`${environment.apiUrl}/admin/allcompanies`, { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
      this.companies = data;
      this.addresses = [];
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
    
   });
  }

  getAll(){
    if(this.entity =="student"){
      this.getAllUsers();
    }else{
      this.getAllCompanies();
    }
  }
  addresses = [];
  changeMode(){
    if(this.mode == "table"){
      this.mode = "map";
      
      this.addresses = [];
      this.users.forEach(element => {
        this.addresses.push(element.email);
      });
      localStorage.setItem("addresses",JSON.stringify(this.addresses));
      localStorage.setItem("entity",this.entity );
    }else{
      this.mode = "table";
    }
  }
  public nameUserDelete = "";
  public idUserDelete = "";
  public deletepage = "delete";
  public togglePopup(){
    document.getElementById("popup-1").classList.toggle("active");
  }
  public deleteUser(id : string){
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
    this.http.delete(`${environment.apiUrl}/admin/student/`+id, { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
      this.deletepage = "success";
      //this.users = data;
      //this.addresses = [];
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
    this.deletepage = "error";
   });
  }

  
  toggleSelection(email,id){
    if(this.addresses.indexOf(email) != -1){
      this.addresses.splice(this.addresses.indexOf(email),1);
      this.groupIdDelete.splice(this.groupIdDelete.indexOf(id),1);
    }else{
      this.addresses.push(email);
      this.groupIdDelete.push(id);
    }
    //console.log(this.addresses);
  }
  toggleSelectAll(){
    if(this.addresses.length < this.users.length){
      this.addresses = [];
      this.groupIdDelete = [];
      this.users.forEach(element => {
        this.addresses.push(element.email);
        this.groupIdDelete.push(element.id);
      });
    }else{
      this.addresses = [];
      this.groupIdDelete = [];
    }
  }

  mail(){
    localStorage.setItem("addresses",JSON.stringify(this.addresses));
    this.router.navigate(["/admin/send"]);
  }

  oneMail(email){
    this.addresses = [email];
    localStorage.setItem("addresses",JSON.stringify(this.addresses));
    this.router.navigate(["/admin/send"]);
  }

  public togglePopupUser(){
    //this.popup = 'home';
    this.pageuser = "profile";
    document.getElementById("popup-2").classList.toggle("active");
  }
  user = new User("student");
  picture = "../../../assets/img/profil.png";
  pageuser = "profile";
  idUserUpdate = "";
  viewProfileUser(data : any){
    this.idUserUpdate = data.id;
    this.user.firstname =data.firstname;
    this.user.lastname =data.lastname;
    this.user.email =data.email;
    this.user.country =data.country;
    this.user.city =data.city;
    this.user.address =data.address;
    this.user.workAt =data.workAt;
    this.user.class =data.class;
    this.user.linkedin =data.linkedin;
    this.user.type =data.type;
    this.user.phone =data.phone;
    this.user.aboutme =data.aboutme;
    this.user.promotion = data.promotion;
    if(data.picture != undefined && data.picture != ""){
      this.picture = data.picture;
    }
    this.togglePopupUser();

  }
  updateProfileUser(){
    console.log(this.user);
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
    this.http.patch(`${environment.apiUrl}/admin/student/`+this.idUserUpdate,this.user, { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
      
      this.pageuser = "profile";
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
    this.pageuser = "profile";
   });
  }

  cancelUpdateProfileUser(){
    this.pageuser = "profile";
  }
  company = new Company();
  pageCompany = "profile";
  idCompanyUpdate = "";
  logo = "./assets/img/companyprofil.png";
  public togglePopupCompany(){
    //this.popup = 'home';
    document.getElementById("popup-3").classList.toggle("active");
  }
  viewProfileCompany(data : any){
    this.idCompanyUpdate = data.id;
    this.company.name =data.name;
      this.company.email =data.email;
      this.company.country =data.country;
      this.company.city =data.city;
      this.company.address =data.address;
      this.company.website =data.website;
      this.company.phone =data.phone;
      this.company.about =data.about;
      if(data.logo != undefined && data.logo != ""){
        this.logo = data.logo;
      }
    this.togglePopupCompany();
  }
  updateProfileCompany(){
    console.log(this.company);
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
    this.http.patch(`${environment.apiUrl}/admin/company/`+this.idCompanyUpdate,this.company, { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
      
      this.pageCompany = "profile";
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
    this.pageCompany = "profile";
   });
  }
  deleteGroup = "delete";
  groupIdDelete = [];
  public togglePopupGroup(){
    //this.popup = 'home';
    this.deleteGroup = "delete";
    document.getElementById("popup-4").classList.toggle("active");
  }
  public deleteGroupItems(){
    console.log(this.groupIdDelete);
    var obj = {"deleteArray": this.groupIdDelete};
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
    this.http.post(`${environment.apiUrl}/admin/` + this.entity + "/delete",obj, { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
      this.groupIdDelete = [];
      this.addresses = [];
      this.deleteGroup = "success";
      /*if(this.entity == "student"){
        this.users = [];
      }else if(this.entity == "company"){
        this.companies = [];
      }*/
      
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
    this.deleteGroup = "error";
   });
  }
}
