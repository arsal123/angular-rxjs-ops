import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { inject } from '@angular/core';
import { CacheService } from '../services/cache.service';

export const cachingInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const cacheService = inject(CacheService);

    if (req.method !== 'GET') {
        return next(req);
    }

    const cachedResponse = cacheService.get(req.urlWithParams);
    if (cachedResponse) {
        console.log(`Returning Cached Response ${cachedResponse}`);
        return of(cachedResponse as HttpResponse<unknown>);
    }

    return next(req).pipe(
        tap(event => {
            if (event instanceof HttpResponse){
                cacheService.set(req.urlWithParams, event.clone())
            }
            
        }));
    
}