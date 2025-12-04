import { Routes } from '@angular/router';
import { HomeUserComponent } from './home-user/home-user.component';
//import { MapsUserComponent } from './maps-user/maps-user.component';
import { ProfileUserComponent } from './profile-user/profile-user.component';
import { SearchUserComponent } from './search-user/search-user.component';



export const UserRoutes: Routes = [
  { path: 'home',               component: HomeUserComponent },
  { path: 'profile',            component: ProfileUserComponent },
  { path: 'search',             component: SearchUserComponent },
  //{ path: 'maps', component: MapsUserComponent },
];