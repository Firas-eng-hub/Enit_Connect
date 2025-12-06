import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { User } from '../models/user.model';
import { ProfileService } from '../services/profile.service';


@Component({
  selector: 'app-profile-user',
  templateUrl: './profile-user.component.html',
  styleUrls: ['./profile-user.component.css']
})
export class ProfileUserComponent implements OnInit {
  selectedFile : File;
  form: FormGroup;
  imageData: string;
  modifPic = false;

  onFileChanged(event) {
    const file = (event.target).files[0];
    this.selectedFile = file;
    console.log(this.selectedFile);
    this.form.patchValue({ image: file });
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (file && allowedMimeTypes.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageData = reader.result as string;
        
      };
      reader.readAsDataURL(file);
      
    }
    this.modifPic = true;
  }

  updateProfilePicture(){
    var profileData = new FormData();
    profileData.append("name",this.form.value.name);
    profileData.append("image",  this.selectedFile, this.selectedFile.name);
    console.log(profileData);
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("userToken")});
    this.http.post(`${environment.apiUrl}/student/upload/` + localStorage.getItem("user_id"), profileData, { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
      this.page = "profile";
      window.location.reload();
   },
   (err : HttpErrorResponse)=>{
    console.log(err);
    this.page = "profile";
   });
    this.form.reset();
    this.imageData = null;
  }

  
  readonly url = `${environment.apiUrl}/student/`;
  constructor(private http : HttpClient, private profileService: ProfileService) { }
  user = new User("student");
  page = "profile";
  picture = "../../../assets/img/profil.png";
  date = new Date();
  years = [];
  countries = [];
  cities = [];
  

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
  ngOnInit() {
    
    this.form = new FormGroup({
      name: new FormControl(null),
      image: new FormControl(null),
    });
    let i = 0;
    for(i=2000; i<this.date.getFullYear() + 5;i++){
      this.years.push(i+"");
    }
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("userToken")});
    this.http.get(this.url+localStorage.getItem("user_id"), { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
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
      this.user.promotion =data.promotion;
      if(data.picture != undefined && data.picture != ""){
        this.picture = data.picture;
      }
      
   },
   (err : HttpErrorResponse)=>{
     
   });
   this.http.get('assets/json/countries.json').subscribe((data : any )=> {
     data.countries.forEach(element => {
       this.countries.push(element.country);
     });
  });
  console.log(this.countries);
  }
  public setCities(country : string){
    this.http.get('assets/json/countries.json').subscribe((data : any )=> {
      data.countries.forEach(element => {
        if(element.country == country){
          this.cities = element.states;
          return;
        }
      });
   });
  }
  public togglePopup(){
    document.getElementById("popup-1").classList.toggle("active");
  }
  updateProfile(){
    console.log(this.user);
    this.togglePopup();
    document.getElementById("savechanges").setAttribute("disabled","true");
    document.getElementById("savechanges").setAttribute("style","cursor: not-allowed! important;");
    var reqHeader = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem("userToken")});
    this.http.patch(`${environment.apiUrl}/student/`+localStorage.getItem("user_id"),this.user, { headers: reqHeader }).subscribe((data : any)=>{
      console.log(data);
      if(this.modifPic){
        this.updateProfilePicture();
      }else{
        this.page = "profile";
        this.togglePopup();
        //window.location.reload();
      }
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
