import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  public popup = 'home';
  public togglePopup(){
    this.popup = 'home';
    document.getElementById("popup-1").classList.toggle("active");
  }
  public createUserAccount(){
    this.popup = 'createUserAccount';
  }
  public createCompanyAccount(){
    this.popup = 'createCompanyAccount';
  }
  public loginCompany(){
    this.popup = 'loginCompany';
  }
}
