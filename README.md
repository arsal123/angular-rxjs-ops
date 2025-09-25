# Angular RxJS Operations Demo

> An Angular 18 application to demonstrate RxJS operators, reactive programming, and interceptor caching pattern.

![Application Screenshot](app-screenshot.jpg)

## 🚀 Key Features

- **Modern Angular 18** - Built with standalone components architecture
- **RxJS Patterns** - Demonstrated RxJS Operators and patterns
- **Intelligent Caching** - Used Interceptor and Memory-based cache service with TTL support and statistics
- **Real-time Integration** - Integration with ReqRes.in mock API for users data
- **Error Handling** - Robust error handling with retry mechanisms and graceful fallbacks
- **Type Safe** - Full TypeScript implementation with strict type checking

## 📑 Table of Contents

- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Commands](#development-commands)
- [Project Architecture](#-project-architecture)
  - [File Structure](#file-structure)
  - [Key Components](#key-components)
- [Cache Service](#-cache-service)
  - [Features](#cache-features)
  - [Usage Examples](#cache-usage)
- [API Integration](#-api-integration)
- [RxJS Patterns](#-rxjs-patterns)
- [Features & Components](#-features--components)
- [Contributing](#-contributing)

## 🛠 Technology Stack

### Core Technologies
- **Angular**: 18.2.x - Modern web framework with standalone components
- **TypeScript**: 5.5.x - Type-safe JavaScript with advanced features
- **RxJS**: 7.8.x - Reactive programming library for handling asynchronous operations

### External Services
- **ReqRes.in API** - Mock REST API for user data (https://reqres.in/api/users)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: Version 18.19.1+, 20.11.1+, or 22.0.0+
- **npm**: Version 6.11.0+, 7.5.6+, or 8.0.0+
- **Angular CLI**: `npm install -g @angular/cli`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd angular-rxjs-ops
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify installation**
   ```bash
   ng version
   ```

### Development Commands

#### Development Server
```bash
# Start development server at http://localhost:4200
ng serve
# Alternative command
npm start
```


#### Testing
```bash
# Run unit tests with Karma
ng test
# Alternative test command
npm run test
```


## 🏗 Project Architecture

This project leverages Angular 18's modern **standalone components architecture**, eliminating the need for NgModules in most cases and providing a more streamlined development experience.

### File Structure

```
src/
├── app/
│   ├── components/
│   │   ├── user/                    # Individual user display component
│   │   │   ├── user.component.ts
│   │   │   ├── user.component.html
│   │   │   ├── user.component.css
│   │   │   └── user.component.spec.ts
│   │   └── userList/               # User list container component
│   │       ├── user-list.component.ts
│   │       ├── user-list.component.html
│   │       ├── user-list.component.css
│   │       └── user-list.component.spec.ts
│   ├── interceptors/
│   │   └── caching.interceptor.ts  # HTTP caching interceptor
│   ├── models/
│   │   ├── user.model.ts           # User interface definition
│   │   └── api-response.model.ts   # API response interfaces
│   ├── services/
│   │   ├── cache.service.ts        # Intelligent caching service
│   │   ├── cache.service.spec.ts
│   │   ├── user.service.ts         # User data service
│   │   └── user.service.spec.ts
│   ├── app.component.ts            # Root standalone component
│   ├── app.config.ts               # Application configuration
│   └── app.routes.ts               # Route definitions
├── environments/
│   ├── environment.ts              # Development environment
│   └── environment.prod.ts         # Production environment
├── public/                         # Static assets
├── index.html                      # Main HTML template
├── main.ts                         # Application entry point
└── styles.css                      # Global styles
```

### Key Components


### Cache Features

The **CacheService** provides a comprehensive in-memory caching solution with the following features:

- ⏰ **TTL Support** - Automatic expiration with configurable time-to-live
- 📊 **Statistics Tracking** - Hit/miss ratios and performance monitoring
- 🔄 **RxJS Integration** - Observable-based API for reactive programming


### HTTP Interceptor Integration
```typescript path=/Users/arsal/projects/fe/ang-apps/angular-rxjs-ops/src/app/interceptors/caching.interceptor.ts start=6
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
```

### Error Handling Strategy
```typescript path=/Users/arsal/projects/fe/ang-apps/angular-rxjs-ops/src/app/services/user.service.ts start=51
getUsers(config?: RequestConfig): Observable<User[]> {
  const headers = this.buildHeaders(config?.headers);
  const retryAttempts = config?.retryAttempts ?? this.defaultRetryAttempts;

  return this.http.get<ApiResponse<User[]>>(this.baseUrl, { headers }).pipe(
    map(response => this.transformUsersResponse(response)),
    retry({ count: retryAttempts, delay: 1000 }),
    catchError(error => this.handleError<User[]>(error, 'fetchUsersFromApi', []))
  );
}
```

## ⚡ RxJS Patterns

### Subscription Management Pattern
```typescript path=null start=null
export class UserListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  
  ngOnInit() {
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        // Handle users
      });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Error Handling with Retry Logic
```typescript path=null start=null
return this.http.get<User[]>(this.apiUrl).pipe(
  retry({ count: 3, delay: 1000 }),
  catchError(error => {
    console.error('API call failed:', error);
    return of([]); // Return empty array as fallback
  }),
  finalize(() => {
    this.loading.set(false);
  })
);
```

### Operators Used in This Project

#### Creation Operators
- **`of()`** - Creates observables from values for fallback scenarios
- **`Subject()`** - Used for component lifecycle management

#### Transformation Operators
- **`map()`** - Transform API responses to application models
- **`tap()`** - Side effects like logging and caching

#### Filtering & Utility Operators
- **`takeUntil()`** - Automatic subscription cleanup
- **`finalize()`** - Cleanup operations regardless of success/failure
- **`retry()`** - Automatic retry for failed HTTP requests

#### Error Handling Operators
- **`catchError()`** - Graceful error handling with fallbacks

