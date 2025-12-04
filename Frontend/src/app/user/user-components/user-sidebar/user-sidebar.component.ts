import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { User } from 'app/user/models/user.model';

declare const $: any;
declare interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}
export var ROUTES: RouteInfo[] = [];

@Component({
  selector: 'app-user-sidebar',
  templateUrl: './user-sidebar.component.html',
  styleUrls: ['./user-sidebar.component.css']
})
export class UserSidebarComponent implements OnInit {
  menuItems: any[];
  readonly url = 'http://pfa2-nodejs.herokuapp.com/student/';
  constructor(private http : HttpClient) { }
  
  ngOnInit() {
    ROUTES = [
      { path: '/user/home', title: 'Home',  icon: 'home', class: '' },
      { path: '/user/documents', title: 'Documents',  icon:'description', class: '' },
      { path: '/user/search', title: 'Search',  icon:'search', class: '' },
      { path: '/user/profile', title: 'My profile' ,  icon:'person', class: '' },
    ];
    this.menuItems = ROUTES.filter(menuItem => menuItem);
  }
  isMobileMenu() {
      if ($(window).width() > 991) {
          return false;
      }
      return true;
  };

  logout(){
    localStorage.removeItem('userToken');
    localStorage.removeItem('user_id');
    window.location.replace('/visitor/news');
  }

}
