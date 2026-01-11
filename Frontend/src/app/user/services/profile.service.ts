import { environment } from '../../../environments/environment';
import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import { map } from "rxjs/operators";

import { User } from "../models/user.model";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ProfileService {

  readonly url = `${environment.apiUrl}/api/student/`;

  constructor(private http: HttpClient) {}

  

  

  updatePicture(name :string ,image: File ) {
    const profileData = new FormData();
    profileData.append("name",name);
    profileData.append("image", image, name);
    
    return this.http.patch(`${environment.apiUrl}/api/student/upload/` + localStorage.getItem("user_id"), profileData);
  }
}