import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

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
