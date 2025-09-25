import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {
  // Signal inputs for user data
  avatar = input<string>('');
  firstName = input<string>('');
  lastName = input<string>('');
  email = input<string>('');
  id = input<number>(0);

  /**
   * Handles image loading errors by setting a fallback image
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://via.placeholder.com/150/CCCCCC/666666?text=User';
    }
  }
}
