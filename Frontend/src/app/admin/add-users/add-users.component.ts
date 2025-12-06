import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Company } from 'app/company/models/company.model';
import { RegisterCompanyService } from 'app/company/services/register-company.service';
import { User } from 'app/user/models/user.model';
import { RegisterUserService } from 'app/user/services/register-user.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-add-users',
  templateUrl: './add-users.component.html',
  styleUrls: ['./add-users.component.css']
})
export class AddUsersComponent implements OnInit {

  constructor(private http : HttpClient,private registerCompanyService : RegisterCompanyService,private registerUserService : RegisterUserService) {

    this.pagecompany="register";
    this.pageuser="register";
   }
  ngOnInit(): void {
    let i = 0;
    for(i=2000; i<this.date.getFullYear() + 5;i++){
      this.years.push(i+"");
    }
    
  }
  
  public togglePopup1(){
    
    document.getElementById("popup-1").classList.toggle("active");
  }
  public togglePopup2(){
    
    document.getElementById("popup-2").classList.toggle("active");
  }

  company = new Company();
  pagecompany = "register";
  
  

 

  registerCompany(){
    document.getElementById("submit-btn-company").setAttribute("disabled","true");
    document.getElementById("submit-btn-company").setAttribute("style","cursor: not-allowed! important;");
    this.registerCompanyService.registerCompany(this.company).subscribe((data : any)=>{
      this.pagecompany = "success";
      console.log(data);
   },
   (err : HttpErrorResponse)=>{
    document.getElementById("submit-btn-company").removeAttribute("disabled");
    document.getElementById("submit-btn-company").setAttribute("style","cursor: pointer;");
    this.pagecompany = "error";
     console.log(err);
   });
    console.log(this.company);
  }


  user = new User("student");
  pageuser = "register";
  type = "student";
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
 

  

  registerUser(){
    this.user.type = this.type;
    document.getElementById("submit-btn-user").setAttribute("disabled","true");
    document.getElementById("submit-btn-user").setAttribute("style","cursor: not-allowed! important;");
    this.registerUserService.registerUser(this.user).subscribe((data : any)=>{
      this.pageuser = "success";
      console.log(data);
   },
   (err : HttpErrorResponse)=>{
    document.getElementById("submit-btn-user").removeAttribute("disabled");
    document.getElementById("submit-btn-user").setAttribute("style","cursor: pointer;");
    this.pageuser = "error";
     console.log(err);
   });
    console.log(this.user);
  }



  page="add";
  data:[][] = [];
  datahead:[];
  config = ["","","","","","","","","",""];
  users = [];
  
  selected : boolean = false;
  

  onFileSelected(evt: any) {
    console.log(evt);
    const target : DataTransfer =  <DataTransfer>(evt.target);
    
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');

    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const bstr: string = e.target.result;

      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      const wsname : string = wb.SheetNames[0];

      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      console.log(ws);

      this.data = (XLSX.utils.sheet_to_json(ws, { header: 1 }));
      this.datahead = this.data[0];
      
      this.data.shift();
      this.selected = true;
      

    };

    reader.readAsBinaryString(target.files[0]);

  }
 
  registerUsers(){
    this.data.forEach(usr =>{
      var user = new User("student");
      if(this.config.indexOf('firstname') != -1){
        user.firstname = usr[this.config.indexOf('firstname')];
      }
      if(this.config.indexOf('lastname') != -1){
        user.lastname = usr[this.config.indexOf('lastname')];
      }
      if(this.config.indexOf('class') != -1){
        user.class = usr[this.config.indexOf('class')];
      }
      if(this.config.indexOf('email') != -1){
        user.email = usr[this.config.indexOf('email')];
      }
      if(this.config.indexOf('phone') != -1){
        user.phone = usr[this.config.indexOf('phone')];
      }
      if(this.config.indexOf('promotion') != -1){
        user.promotion = usr[this.config.indexOf('promotion')];
      }
      if(this.config.indexOf('country') != -1){
        user.country = usr[this.config.indexOf('country')];
      }
      if(this.config.indexOf('city') != -1){
        user.city = usr[this.config.indexOf('city')];
      }
      if(this.config.indexOf('address') != -1){
        user.address = usr[this.config.indexOf('address')];
      }
      this.users.push(user);
    });
    document.getElementById("submit-btn").setAttribute("disabled","true");
    document.getElementById("submit-btn").setAttribute("style","cursor: not-allowed! important;");
    
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("adminToken")});
    this.http.post(`${environment.apiUrl}/admin/student/add`, {students : this.users}, { headers: reqHeader }).subscribe((data : any)=>{
      this.page = "success";
      console.log(data);
   },
   (err : HttpErrorResponse)=>{
    document.getElementById("submit-btn").removeAttribute("disabled");
    document.getElementById("submit-btn").setAttribute("style","cursor: pointer;");
    this.page = "error";
     console.log(err);
   });
    console.log(this.users);
    console.log(this.config);
  }
}
