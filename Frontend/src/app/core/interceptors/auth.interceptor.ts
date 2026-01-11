import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // Add withCredentials to all API requests (required for cookies)
        request = request.clone({
            withCredentials: true
        });

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    // Token expired or invalid
                    return this.handle401Error(request, next);
                }
                return throwError(error);
            })
        );
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Don't try to refresh if we're already on a login page or refresh endpoint
        if (request.url.includes('/signin') ||
            request.url.includes('/login') ||
            request.url.includes('/auth/refresh') ||
            request.url.includes('/auth/check')) {
            return throwError({ status: 401, message: 'Unauthorized' });
        }

        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
                switchMap(() => {
                    this.isRefreshing = false;
                    this.refreshTokenSubject.next(true);
                    return next.handle(request);
                }),
                catchError((err) => {
                    this.isRefreshing = false;
                    // Refresh failed - logout and redirect to login
                    this.authService.logout().subscribe(() => {
                        this.router.navigate(['/visitor/login']);
                    });
                    return throwError(err);
                })
            );
        } else {
            // Wait for refresh to complete
            return this.refreshTokenSubject.pipe(
                filter(token => token != null),
                take(1),
                switchMap(() => next.handle(request))
            );
        }
    }
}
