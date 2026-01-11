import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Company } from '../models/company.model';

@Injectable({
  providedIn: 'root'
})
export class LoginCompanyService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  public loginCompany(company: Company) {
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json', 'No-Auth': 'True' });
    return this.http.post(`${this.apiUrl}/company/login`, company, { headers: reqHeader, withCredentials: true });
  }
}
