import { Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MembersComponent } from './members/members.component';
import { NewsComponent } from './news/news.component';


export const VisitorRoutes: Routes = [
  {
    path: '',
    redirectTo: 'news',
    pathMatch: 'full',
  },
  { path: 'news',               component: NewsComponent },
  { path: 'statistics',               component: DashboardComponent },
  { path: 'members',                   component: MembersComponent },
  { path: 'about',                component: AboutComponent },
  {
    path: '**',
    redirectTo: 'news',
    pathMatch: 'full',
  }
];