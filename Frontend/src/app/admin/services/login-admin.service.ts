import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Admin } from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class LoginAdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  loginUser(admin: Admin) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True' });
    return this.http.post(`${this.apiUrl}/admin/login`, admin, { headers: reqHeader, withCredentials: true });
  }
}
