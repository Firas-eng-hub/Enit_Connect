import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
}

export interface AuthState {
    authenticated: boolean;
    userType: 'student' | 'company' | 'admin' | null;
    user: AuthUser | null;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.apiUrl;

    private authState = new BehaviorSubject<AuthState>({
        authenticated: false,
        userType: null,
        user: null
    });

    public authState$ = this.authState.asObservable();

    constructor(private http: HttpClient) {
        // Check auth status on service initialization
        this.checkAuthStatus().subscribe();
    }

    // Check if user is authenticated (calls backend to verify cookie)
    checkAuthStatus(): Observable<AuthState> {
        return this.http.get<any>(`${this.apiUrl}/api/auth/check`, { withCredentials: true }).pipe(
            map(response => {
                const state: AuthState = {
                    authenticated: response.authenticated,
                    userType: response.userType,
                    user: response.user
                };
                this.authState.next(state);
                return state;
            }),
            catchError(() => {
                const state: AuthState = { authenticated: false, userType: null, user: null };
                this.authState.next(state);
                return of(state);
            })
        );
    }

    // Get current auth state synchronously
    getAuthState(): AuthState {
        return this.authState.getValue();
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return this.authState.getValue().authenticated;
    }

    // Get current user type
    getUserType(): string | null {
        return this.authState.getValue().userType;
    }

    // Get current user
    getCurrentUser(): AuthUser | null {
        return this.authState.getValue().user;
    }

    // Login - backend sets HTTP-only cookies
    login(userType: 'student' | 'company' | 'admin', credentials: { email: string, password: string }): Observable<any> {
        const endpoints = {
            student: `${this.apiUrl}/api/student/login`,
            company: `${this.apiUrl}/api/company/login`,
            admin: `${this.apiUrl}/api/admin/login`
        };

        return this.http.post<any>(endpoints[userType], credentials, { withCredentials: true }).pipe(
            tap(response => {
                // Update auth state with response data
                this.authState.next({
                    authenticated: true,
                    userType: userType,
                    user: {
                        id: response.id,
                        email: response.email,
                        name: response.name
                    }
                });

                // Store user info in localStorage (NOT tokens - those are in HTTP-only cookies)
                // Store ID with the correct key based on user type
                const idKeys = {
                    student: 'user_id',
                    company: 'company_id',
                    admin: 'admin_id'
                };
                localStorage.setItem(idKeys[userType], response.id);
                localStorage.setItem('name', response.name);
                localStorage.setItem('userType', userType);
            })
        );
    }

    // Logout - clears HTTP-only cookies via backend
    logout(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/api/auth/logout`, {}, { withCredentials: true }).pipe(
            tap(() => {
                this.clearLocalData();
            }),
            catchError(() => {
                this.clearLocalData();
                return of({ message: 'Logged out' });
            })
        );
    }

    // Clear local storage data
    private clearLocalData(): void {
        // Clear auth state
        this.authState.next({ authenticated: false, userType: null, user: null });

        // Clear localStorage (but NOT tokens - they're in HTTP-only cookies)
        localStorage.removeItem('user_id');
        localStorage.removeItem('admin_id');
        localStorage.removeItem('company_id');
        localStorage.removeItem('name');
        localStorage.removeItem('userType');

        // Remove old token storage (for migration from old system)
        localStorage.removeItem('userToken');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('companyToken');
    }

    // Refresh token
    refreshToken(): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/api/auth/refresh`, {}, { withCredentials: true });
    }
}
