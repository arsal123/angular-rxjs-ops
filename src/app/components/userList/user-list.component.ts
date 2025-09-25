import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { CacheService, CacheStats } from '../../services/cache.service';
import { UserComponent } from '../user/user.component';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, UserComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  public readonly cacheService = inject(CacheService);
  private readonly finalize = finalize;
  private readonly destroy$ = new Subject<void>();
  private userServiceSubscription: Subscription | null = null;

  // Signals for component state
  users = signal<User[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  cacheStats = signal<CacheStats | null>(null);
  

  ngOnInit(): void {
    this.loadUsers();
    this.loadCacheStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe();
    }
  }

  public loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userServiceSubscription = this.userService.getUsers()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (users) => {
          this.users.set(users);
          console.log(`Loaded ${users.length} users successfully`);
          // Refresh cache stats after loading users
          this.loadCacheStats();
        },
        error: (err) => {
          const errorMessage = 'Failed to load users. Please try again later.';
          this.error.set(errorMessage);
          console.error('Error loading users:', err);
        }
      });
  }

  /**
   * Retry loading users when error occurs
   */
  retryLoadUsers(): void {
    this.loadUsers();
  }

  /**
   * Load cache statistics from the cache service
   */
  loadCacheStats(): void {
    this.cacheService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.cacheStats.set(stats);
          console.log('Cache stats loaded:', stats);
        },
        error: (err) => {
          console.error('Error loading cache stats:', err);
          this.cacheStats.set(null);
        }
      });
  }

  /**
   * Refresh both users and cache stats
   */
  refreshData(): void {
    this.loadUsers();
    this.loadCacheStats();
  }

  /**
   * Clear cache and refresh stats
   */
  clearCache(): void {
    this.cacheService.clear()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Cache cleared successfully');
          this.loadCacheStats();
        },
        error: (err) => {
          console.error('Error clearing cache:', err);
        }
      });
  }
}
