import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterUserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  registerUser(user: User) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True' });
    return this.http.post(`${this.apiUrl}/student/signup`, user, { headers: reqHeader });
  }
}
