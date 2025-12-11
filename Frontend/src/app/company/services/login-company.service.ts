import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Company } from '../models/company.model';

@Injectable({
  providedIn: 'root'
})
export class LoginCompanyService {

  
  constructor(private http : HttpClient) { }

  public loginCompany(company : Company){
    var reqHeader = new HttpHeaders({ 'Content-Type': 'application/json','No-Auth':'True' });
    return this.http.post(`${environment.apiUrl}/api/company/login`, company, { headers: reqHeader });
  }
}
