import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = false;
  isLoading = false;

  onLogin(): void {
    this.error = false;
    this.isLoading = true;

    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error = true;
        this.isLoading = false;
      },
    });
  }

  fillCredentials(email: string, password: string): void {
    this.email = email;
    this.password = password;
    this.error = false;
  }
}
