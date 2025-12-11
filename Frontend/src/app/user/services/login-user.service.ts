import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginUserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  loginUser(user: User) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True' });
    return this.http.post(`${this.apiUrl}/api/student/login`, user, { headers: reqHeader });
  }
}
