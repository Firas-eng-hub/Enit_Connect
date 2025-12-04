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
  selector: 'app-visitor-sidebar',
  templateUrl: './visitor-sidebar.component.html',
  styleUrls: ['./visitor-sidebar.component.css']
})
export class VisitorSidebarComponent implements OnInit {
  menuItems: any[];
  connected = false;
  constructor() { }

  ngOnInit() {
    ROUTES = [
      { path: '/visitor/news', title: 'News',  icon: 'menu', class: '' },
      { path: '/visitor/statistics', title: 'Statistics',  icon: 'trending_up', class: '' },
      //{ path: '/visitor/members', title: 'Our members',  icon: 'people_alt', class: '' },
      //{ path: '/visitor/about', title: 'About us',  icon: 'info', class: '' },
    ];
    
    this.menuItems = ROUTES.filter(menuItem => menuItem);
  }
  isMobileMenu() {
      /*if ($(window).width() > 991) {
          return false;
      }*/
      return true;
  };

  public togglePopup(){
    document.getElementById("popup-1").classList.toggle("active");
  }

}
