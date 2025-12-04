import { Routes } from '@angular/router';
import { DocumentsComponent } from './documents/documents.component';
import { HomeUserComponent } from './home-user/home-user.component';
//import { MapUserComponent } from './map-user/map-user.component';
import { ProfileUserComponent } from './profile-user/profile-user.component';
import { SearchUserComponent } from './search-user/search-user.component';



export const UserRoutes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  { path: 'home',               component: HomeUserComponent },
  { path: 'profile',            component: ProfileUserComponent },
  { path: 'search',             component: SearchUserComponent },
  { path: 'documents',          component: DocumentsComponent },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  }
];