import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of} from 'rxjs';
import { catchError, retry, switchMap, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

/**
 * Configuration options for HTTP requests
 */
export interface RequestConfig {
  retryAttempts?: number;
  headers?: { [key: string]: string };
}

/**
 * User creation/update payload interface
 */
export interface UserPayload {
  name?: string;
  job?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * UserService following Angular best practices
 * 
 * Features:
 * - Comprehensive error handling with empty array fallback
 * - Retry logic for transient failures
 * - Type safety with interfaces  
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = 'https://reqres.in/api/users';
  private readonly apiKey = 'reqres-free-v1';
  private readonly defaultRetryAttempts = 3;

  private readonly http = inject(HttpClient);

  /**
   * Retrieves all users from the API
   * 
   * @param config - Optional request configuration
   * @returns Observable<User[]> - Always returns an array (empty on error)
   */
  getUsers(config?: RequestConfig): Observable<User[]> {
    const headers = this.buildHeaders(config?.headers);
    const retryAttempts = config?.retryAttempts ?? this.defaultRetryAttempts;

    return this.http.get<ApiResponse<User[]>>(this.baseUrl, { headers }).pipe(
      map(response => this.transformUsersResponse(response)),
      retry({ count: retryAttempts, delay: 1000 }),
      catchError(error => this.handleError<User[]>(error, 'fetchUsersFromApi', []))
    );
  }

  /**
   * Creates a new user
   * 
   * @param userData - User data for creation
   * @param config - Optional request configuration
   * @returns Observable<User> - The created user or null on error
   */
  postUser(userData: UserPayload, config?: RequestConfig): Observable<User | null> {
    const headers = this.buildHeaders(config?.headers);
    const retryAttempts = config?.retryAttempts ?? this.defaultRetryAttempts;

    return this.http.post<User>(this.baseUrl, userData, { headers }).pipe(
      map(response => this.transformUserResponse(response)),
      retry({ count: retryAttempts, delay: 1000 }),
      catchError(error => this.handleError<User | null>(error, 'postUser', null))
    );
  }

  /**
   * Gets a specific user by ID
   * 
   * @param id - User ID
   * @param config - Optional request configuration
   * @returns Observable<User | null> - The user or null if not found/error
   */
  getUserById(id: number, config?: RequestConfig): Observable<User | null> {
    const url = `${this.baseUrl}/${id}`;
    const headers = this.buildHeaders(config?.headers);
    const retryAttempts = config?.retryAttempts ?? this.defaultRetryAttempts;

    return this.http.get<ApiResponse<User>>(url, { headers }).pipe(
      map(response => this.transformUserResponse(response.data)),
      retry({ count: retryAttempts, delay: 1000 }),
      catchError(error => this.handleError<User | null>(error, 'fetchUserByIdFromApi', null))
    );
  }

  /**
   * Builds HTTP headers for requests
   * 
   * @private
   * @param customHeaders - Optional custom headers
   * @returns HttpHeaders
   */
  private buildHeaders(customHeaders?: { [key: string]: string }): HttpHeaders {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...customHeaders
    };

    return new HttpHeaders(headers);
  }

  /**
   * Transforms API response for users list
   * 
   * @private
   * @param response - API response
   * @returns User[] - Transformed user array
   */
  private transformUsersResponse(response: ApiResponse<User[]>): User[] {
    const users = response.data || [];
    return users;
  }

  /**
   * Transforms API response for single user
   * 
   * @private
   * @param user - User data
   * @returns User - Transformed user
   */
  private transformUserResponse(user: User): User {
    return {
      ...user,
      // Ensure all required fields are present
      id: user.id || 0,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      avatar: user.avatar || ''
    };
  }

  /**
   * Centralized error handling that always returns a safe fallback value
   * 
   * @private
   * @param error - The error object
   * @param operation - The operation that failed
   * @param fallbackValue - Safe fallback value to return
   * @returns Observable with fallback value
   */
  private handleError<T>(error: any, operation = 'operation', fallbackValue: T): Observable<T> {
    console.error(`UserService.${operation} failed:`, error);

    // Return safe fallback value (empty array for lists, null for single items)
    return of(fallbackValue);
  }
}
