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
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css']
})
export class AdminSidebarComponent implements OnInit {

  menuItems: any[];
  constructor() { }

  ngOnInit() {
    ROUTES = [
      { path: '/admin/home', title: 'Home',  icon: 'home', class: '' },
      { path: '/admin/messages', title: 'Messages',  icon:'message', class: '' },
      { path: '/admin/documents', title: 'Documents',  icon:'post_add', class: '' },
      { path: '/admin/add', title: 'Add users',  icon: 'group_add', class: '' },
      { path: '/admin/send', title: 'Send Email',  icon:'send', class: '' },
      { path: '/admin/search', title: 'Search',  icon:'search', class: '' },
      
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
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin_id');
    window.location.replace('/admin/login');
    //location.reload();
    
  }

}
