# Angular → React Migration Map

## Feature Inventory

### Authentication System
| Feature | Angular Source | React Target | API Endpoints |
|---------|---------------|--------------|---------------|
| Student Login | `user/login-user/` | `features/auth/components/LoginStudent.tsx` | `POST /api/student/login` |
| Student Register | `user/register-user/` | `features/auth/components/RegisterStudent.tsx` | `POST /api/student/signup` |
| Company Login | `company/login-company/` | `features/auth/components/LoginCompany.tsx` | `POST /api/company/login` |
| Company Register | `company/register-company/` | `features/auth/components/RegisterCompany.tsx` | `POST /api/company/signup` |
| Admin Login | `admin/login-admin/` | `features/auth/components/LoginAdmin.tsx` | `POST /api/admin/login` |
| Auth State | `core/services/auth.service.ts` | `features/auth/hooks/useAuth.ts` | `GET /api/auth/check` |
| Logout | `core/services/auth.service.ts` | `features/auth/hooks/useAuth.ts` | `POST /api/auth/logout` |

### Route Guards
| Guard | Angular Source | React Target |
|-------|---------------|--------------|
| IsVisitorGuard | `visitor/guards/is-visitor.guard.ts` | `app/router/guards/RequireVisitor.tsx` |
| IsUserGuard | `user/guards/is-user.guard.ts` | `app/router/guards/RequireStudent.tsx` |
| IsCompanyGuard | `company/guards/is-company.guard.ts` | `app/router/guards/RequireCompany.tsx` |
| IsAdminGuard | `admin/guards/is-admin.guard.ts` | `app/router/guards/RequireAdmin.tsx` |

### Visitor Module (Public)
| Page | Angular Source | React Target | API |
|------|---------------|--------------|-----|
| News | `visitor/news/` | `pages/visitor/NewsPage.tsx` | `GET /api/admin/news` |
| Statistics | `visitor/dashboard/` | `pages/visitor/StatisticsPage.tsx` | Various stats endpoints |
| Members | `visitor/members/` | `pages/visitor/MembersPage.tsx` | `GET /api/student/members` |
| About | `visitor/about/` | `pages/visitor/AboutPage.tsx` | Static |

### Student (User) Module
| Page | Angular Source | React Target | API |
|------|---------------|--------------|-----|
| Home (Offers) | `user/home-user/` | `pages/student/HomePage.tsx` | `GET /api/offers`, `POST /api/student/apply/:id` |
| Profile | `user/profile-user/` | `pages/student/ProfilePage.tsx` | `GET/PATCH /api/student/:id` |
| Search | `user/search-user/` | `pages/student/SearchPage.tsx` | `POST /api/student/search` |
| Documents | `user/documents/` | `pages/student/DocumentsPage.tsx` | `GET/POST /api/student/documents` |

### Company Module
| Page | Angular Source | React Target | API |
|------|---------------|--------------|-----|
| Home (Manage Offers) | `company/home-company/` | `pages/company/HomePage.tsx` | `GET/POST/DELETE /api/offers` |
| Candidacies | `company/candidacies/` | `pages/company/CandidaciesPage.tsx` | `GET /api/offers/candidacies` |
| Profile | `company/profile-company/` | `pages/company/ProfilePage.tsx` | `GET/PATCH /api/company/:id` |
| Search | `company/search-company/` | `pages/company/SearchPage.tsx` | `POST /api/company/search` |

### Admin Module
| Page | Angular Source | React Target | API |
|------|---------------|--------------|-----|
| Home (News Mgmt) | `admin/home-admin/` | `pages/admin/HomePage.tsx` | `GET/POST/DELETE /api/admin/news` |
| Send Email | `admin/send-email/` | `pages/admin/SendEmailPage.tsx` | `POST /api/admin/email` |
| Search Users | `admin/search-admin/` | `pages/admin/SearchPage.tsx` | `POST /api/admin/search` |
| Add Users | `admin/add-users/` | `pages/admin/AddUsersPage.tsx` | `POST /api/admin/users` |
| Documents | `admin/documents/` | `pages/admin/DocumentsPage.tsx` | `GET /api/admin/documents` |
| Messages | `admin/messages/` | `pages/admin/MessagesPage.tsx` | `GET /api/admin/messages` |

### Layout Components
| Component | Angular Source | React Target |
|-----------|---------------|--------------|
| Visitor Navbar | `visitor/visitor-components/visitor-navbar/` | `widgets/navbars/VisitorNavbar.tsx` |
| Visitor Sidebar | `visitor/visitor-components/visitor-sidebar/` | `widgets/sidebars/VisitorSidebar.tsx` |
| Visitor Footer | `visitor/visitor-components/visitor-footer/` | `widgets/footers/VisitorFooter.tsx` |
| User Navbar | `user/user-components/user-navbar/` | `widgets/navbars/StudentNavbar.tsx` |
| User Sidebar | `user/user-components/user-sidebar/` | `widgets/sidebars/StudentSidebar.tsx` |
| Company Navbar | `company/company-components/company-navbar/` | `widgets/navbars/CompanyNavbar.tsx` |
| Company Sidebar | `company/company-components/company-sidebar/` | `widgets/sidebars/CompanySidebar.tsx` |
| Admin Navbar | `admin/admin-components/admin-navbar/` | `widgets/navbars/AdminNavbar.tsx` |
| Admin Sidebar | `admin/admin-components/admin-sidebar/` | `widgets/sidebars/AdminSidebar.tsx` |

### Data Models
| Model | Angular Source | React Target (TypeScript Interface) |
|-------|---------------|-------------------------------------|
| User/Student | `user/models/user.model.ts` | `entities/student/types.ts` |
| Company | `company/models/company.model.ts` | `entities/company/types.ts` |
| Offer | `company/models/offer.model.ts` | `entities/offer/types.ts` |
| Candidacy | `user/models/candidacy.model.ts` | `entities/offer/types.ts` |
| News | `admin/models/news.model.ts` | `entities/news/types.ts` |
| Document | `user/documents/` | `entities/document/types.ts` |

---

## API Endpoints Summary (from Backend routes)

### Auth Routes (`/api/auth`)
- `GET /api/auth/check` - Check auth status
- `POST /api/auth/logout` - Logout (clears cookies)
- `POST /api/auth/refresh` - Refresh token

### Student Routes (`/api/student`)
- `POST /api/student/signup` - Register
- `POST /api/student/login` - Login
- `GET /api/student/:id` - Get profile
- `PATCH /api/student/:id` - Update profile
- `POST /api/student/upload/:id` - Upload profile picture
- `POST /api/student/companiesinfo` - Get companies info
- `POST /api/student/apply/:offerId` - Apply to offer
- `POST /api/student/search` - Search

### Company Routes (`/api/company`)
- `POST /api/company/signup` - Register
- `POST /api/company/login` - Login
- `GET /api/company/:id` - Get profile
- `PATCH /api/company/:id` - Update profile
- `GET /api/company/user/:id` - Get applicant info

### Offer Routes (`/api/offers`)
- `GET /api/offers` - List all offers
- `POST /api/offers` - Create offer
- `GET /api/offers/:id` - Get offer
- `DELETE /api/offers/:id` - Delete offer
- `GET /api/offers/candidacies?id=` - Get candidacies for offer

### Admin Routes (`/api/admin`)
- `POST /api/admin/login` - Login
- `GET /api/admin/news` - List news
- `POST /api/admin/news` - Create news
- `DELETE /api/admin/news/:id` - Delete news
- `POST /api/admin/search` - Search users
- `POST /api/admin/email` - Send email

---

## New React Folder Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── config/
│   │   │   └── env.ts                    # VITE_API_URL access
│   │   ├── providers/
│   │   │   ├── QueryProvider.tsx         # TanStack Query setup
│   │   │   └── AuthProvider.tsx          # Auth context
│   │   ├── router/
│   │   │   ├── routes.tsx                # Route definitions
│   │   │   ├── guards/
│   │   │   │   ├── RequireAuth.tsx       # Generic auth check
│   │   │   │   ├── RequireVisitor.tsx    # Redirect if logged in
│   │   │   │   ├── RequireStudent.tsx    # Student only
│   │   │   │   ├── RequireCompany.tsx    # Company only
│   │   │   │   └── RequireAdmin.tsx      # Admin only
│   │   │   └── index.tsx                 # Router export
│   │   └── layouts/
│   │       ├── VisitorLayout.tsx
│   │       ├── StudentLayout.tsx
│   │       ├── CompanyLayout.tsx
│   │       └── AdminLayout.tsx
│   │
│   ├── shared/
│   │   ├── api/
│   │   │   └── httpClient.ts             # Axios instance with interceptors
│   │   ├── hooks/
│   │   │   └── useLocalStorage.ts
│   │   ├── lib/
│   │   │   └── utils.ts                  # cn() helper
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       └── ... (shadcn-style)
│   │
│   ├── entities/
│   │   ├── student/
│   │   │   ├── types.ts
│   │   │   ├── api.ts
│   │   │   └── hooks.ts
│   │   ├── company/
│   │   │   ├── types.ts
│   │   │   ├── api.ts
│   │   │   └── hooks.ts
│   │   ├── offer/
│   │   │   ├── types.ts
│   │   │   ├── api.ts
│   │   │   └── hooks.ts
│   │   ├── news/
│   │   │   ├── types.ts
│   │   │   ├── api.ts
│   │   │   └── hooks.ts
│   │   └── document/
│   │       ├── types.ts
│   │       ├── api.ts
│   │       └── hooks.ts
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginStudent.tsx
│   │   │   │   ├── LoginCompany.tsx
│   │   │   │   ├── LoginAdmin.tsx
│   │   │   │   ├── RegisterStudent.tsx
│   │   │   │   └── RegisterCompany.tsx
│   │   │   └── hooks/
│   │   │       └── useAuth.ts
│   │   ├── offers/
│   │   │   ├── components/
│   │   │   │   ├── OfferCard.tsx
│   │   │   │   ├── OfferList.tsx
│   │   │   │   ├── CreateOfferForm.tsx
│   │   │   │   └── ApplyModal.tsx
│   │   │   └── hooks/
│   │   │       └── useOffers.ts
│   │   └── news/
│   │       ├── components/
│   │       │   ├── NewsCard.tsx
│   │       │   ├── NewsList.tsx
│   │       │   └── CreateNewsForm.tsx
│   │       └── hooks/
│   │           └── useNews.ts
│   │
│   ├── widgets/
│   │   ├── navbars/
│   │   │   ├── VisitorNavbar.tsx
│   │   │   ├── StudentNavbar.tsx
│   │   │   ├── CompanyNavbar.tsx
│   │   │   └── AdminNavbar.tsx
│   │   ├── sidebars/
│   │   │   ├── VisitorSidebar.tsx
│   │   │   ├── StudentSidebar.tsx
│   │   │   ├── CompanySidebar.tsx
│   │   │   └── AdminSidebar.tsx
│   │   └── footers/
│   │       └── Footer.tsx
│   │
│   ├── pages/
│   │   ├── visitor/
│   │   │   ├── NewsPage.tsx
│   │   │   ├── StatisticsPage.tsx
│   │   │   ├── MembersPage.tsx
│   │   │   ├── AboutPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── student/
│   │   │   ├── HomePage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   └── DocumentsPage.tsx
│   │   ├── company/
│   │   │   ├── HomePage.tsx
│   │   │   ├── CandidaciesPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── SearchPage.tsx
│   │   └── admin/
│   │       ├── HomePage.tsx
│   │       ├── SendEmailPage.tsx
│   │       ├── SearchPage.tsx
│   │       ├── AddUsersPage.tsx
│   │       ├── DocumentsPage.tsx
│   │       └── MessagesPage.tsx
│   │
│   ├── assets/
│   │   ├── img/
│   │   └── styles/
│   │
│   ├── main.tsx
│   └── index.css                         # Tailwind directives
│
├── .env                                  # VITE_API_URL=
├── .env.production                       # VITE_API_URL= (empty for nginx)
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

---

## Key Migration Notes

### 1. HTTP Client Pattern
**Angular (HttpClient with observables):**
```typescript
this.http.get(`${environment.apiUrl}/api/offers`, { withCredentials: true })
  .subscribe((data) => { ... });
```

**React (Axios + TanStack Query):**
```typescript
// httpClient.ts
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// useOffers.ts
export const useOffers = () => {
  return useQuery({
    queryKey: ['offers'],
    queryFn: () => httpClient.get('/api/offers').then(res => res.data),
  });
};
```

### 2. Auth State Pattern
**Angular (BehaviorSubject):**
```typescript
private authState = new BehaviorSubject<AuthState>({...});
public authState$ = this.authState.asObservable();
```

**React (Context + useState):**
```typescript
const AuthContext = createContext<AuthContextType>(null);
export const useAuth = () => useContext(AuthContext);
```

### 3. Form Handling
**Angular (ReactiveFormsModule):**
```typescript
form = new FormGroup({
  email: new FormControl(''),
  password: new FormControl(''),
});
```

**React (react-hook-form + zod):**
```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

### 4. Guard Implementation
**Angular (CanActivate):**
```typescript
canActivate(): boolean {
  if (localStorage.getItem('userType') === 'student') return true;
  this.router.navigate(['/visitor/news']);
  return false;
}
```

**React (Route wrapper component):**
```typescript
const RequireStudent = ({ children }) => {
  const { userType } = useAuth();
  if (userType === 'student') return children;
  return <Navigate to="/visitor/news" />;
};
```

### 5. localStorage Keys (unchanged)
- `user_id` - Student ID
- `company_id` - Company ID  
- `admin_id` - Admin ID
- `name` - Display name
- `userType` - 'student' | 'company' | 'admin'
