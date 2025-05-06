import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatMenu,
    MatMenuTrigger,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIcon
  ],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss']
})
export class AddProjectComponent implements OnInit {
  project = {
    name: '',
    description: '',
    client: null as Client | null,
    deadline: '',
    category: ''
  };

  categories: string[] = ['Design', 'Development', 'Marketing', 'Research'];
  clients: Client[] = [];
  errorMessage: string | null = null;
  isLoading = false;
  isSubmitting = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchClients();
  }

  fetchClients(): void {
    this.isLoading = true;
    this.http.get<Client[]>('http://localhost:8080/api/clients', { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.clients = response;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching clients', error);
          this.errorMessage = 'Failed to load clients. Please try again.';
          this.isLoading = false;
          this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        }
      });
  }

  submitForm() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    const deadlineDateTime = this.project.deadline ? new Date(this.project.deadline).toISOString() : null;

    const payload = {
      name: this.project.name,
      description: this.project.description,
      clientId: this.project.client?.id || null,
      deadline: deadlineDateTime,
      category: this.project.category
    };

    console.log('Payload being sent:', payload);

    this.http.post<any>('http://localhost:8080/api/projects', payload, { withCredentials: true })
      .subscribe({
        next: (response) => {
          console.log('Project created:', response);
          this.errorMessage = null;
          this.snackBar.open('Project created successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/workspaces']);
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error creating project', error);
          this.isSubmitting = false;
          if (error.error === "User is not part of this workspace") {
            this.errorMessage = "You do not have permission to create a project in this workspace.";
          } else {
            this.errorMessage = 'Failed to create project. Please try again.';
          }
          this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        }
      });
  }

  compareClients(client1: Client, client2: Client): boolean {
    return client1 && client2 ? client1.id === client2.id : client1 === client2;
  }
}

interface Client {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
}
