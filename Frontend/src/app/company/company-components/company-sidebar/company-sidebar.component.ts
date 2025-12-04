import { Component, OnInit } from '@angular/core';

declare const $: any;
declare interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}
export var ROUTES: RouteInfo[] = [];

@Component({
  selector: 'app-company-sidebar',
  templateUrl: './company-sidebar.component.html',
  styleUrls: ['./company-sidebar.component.css']
})
export class CompanySidebarComponent implements OnInit {

  menuItems: any[];
  constructor() { }

  ngOnInit() {
    ROUTES = [
      { path: '/company/home', title: 'Home',  icon: 'home', class: '' },
      //{ path: '/company/maps', title: 'Maps',  icon:'location_on', class: '' },
      //{ path: '/company/notifications', title: 'Notifications',  icon:'notifications', class: '' },
      { path: '/company/profile', title: 'Profile',  icon:'person', class: '' },
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
    localStorage.removeItem('companyToken');
    localStorage.removeItem('company_id');
    window.location.replace('/visitor/login');
    //location.reload();
    
  }

}
