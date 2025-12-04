import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Admin } from '../models/admin.model';


@Injectable({
  providedIn: 'root'
})
export class LoginAdminService {

   //readonly url = 'http://localhost:3000/admin';
   constructor(private http : HttpClient) { }
   loginUser(admin : Admin){
     var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json','No-Auth':'True' });
     return this.http.post('http://localhost:3000/admin', admin, { headers: reqHeader });
   }
}







