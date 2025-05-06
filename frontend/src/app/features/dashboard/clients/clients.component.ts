import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client, ClientService } from '../../../services/main-dashboard/client.service';
import { AuthService } from '../../../core/auth/auth.service';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {ConfirmDialogComponent} from './confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    MatIcon,
    MatProgressSpinner,
    MatDialogModule
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent {
  clientForm: FormGroup;
  clients: Client[] = [];
  filteredClients: Client[] = [];
  isLoading = false;
  activeTab = 'list';
  errorMessage: string | null = null;
  editingClient: Client | null = null;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      contactEmail: ['', [Validators.email, Validators.maxLength(255)]],
      contactPhone: ['', [Validators.maxLength(20)]]
    });

    this.loadClients();
  }

  loadClients() {
    this.isLoading = true;
    this.clientService.getUserClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.filteredClients = [...clients];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user clients', error);
        this.errorMessage = 'Failed to load your clients';
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.clientForm.valid) {
      this.isLoading = true;
      const client = this.clientForm.value;
      this.authService.checkAuthentication();

      if (this.editingClient) {
        this.clientService.updateClient(this.editingClient.id!, client).subscribe({
          next: (updatedClient) => {
            const index = this.clients.findIndex(c => c.id === updatedClient.id);
            if (index !== -1) {
              this.clients[index] = updatedClient;
              this.filteredClients = [...this.clients];
            }
            this.snackBar.open('Client updated successfully!', 'Close', { duration: 3000 });
            this.clientForm.reset();
            this.isLoading = false;
            this.editingClient = null;
            this.activeTab = 'list';
          },
          error: (error) => {
            console.error('Error updating client', error);
            this.errorMessage = 'Failed to update client. Please try again.';
            this.isLoading = false;
          }
        });
      } else {
        this.clientService.createClient(client).subscribe({
          next: (newClient) => {
            this.clients.push(newClient);
            this.filteredClients = [...this.clients];
            this.snackBar.open('Client created successfully!', 'Close', { duration: 3000 });
            this.clientForm.reset();
            this.isLoading = false;
            this.activeTab = 'list';
          },
          error: (error) => {
            console.error('Error creating client', error);
            this.errorMessage = 'Failed to create client. Please make sure you\'re logged in.';
            this.isLoading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.clientForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  editClient(client: Client) {
    this.editingClient = client;
    this.clientForm.patchValue({
      name: client.name,
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || ''
    });
    this.activeTab = 'add';
  }

  deleteClient(client: Client) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete ${client.name}? This action cannot be undone.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.clientService.deleteClient(client.id!).subscribe({
          next: () => {
            this.clients = this.clients.filter(c => c.id !== client.id);
            this.filteredClients = this.filteredClients.filter(c => c.id !== client.id);
            this.snackBar.open('Client deleted successfully!', 'Close', { duration: 3000 });
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error deleting client', error);
            this.errorMessage = 'Failed to delete client. Please try again.';
            this.isLoading = false;
          }
        });
      }
    });
  }


}
