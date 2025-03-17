import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../header/header.component';

@Component({
  selector: 'app-add-project',
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
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

  constructor(private http: HttpClient, private router: Router) {
  }

  ngOnInit(): void {
    this.fetchClients();
  }

  fetchClients(): void {
    this.http.get<Client[]>('http://localhost:8080/api/clients', {withCredentials: true})
      .subscribe(
        (response) => {
          this.clients = response;
        },
        (error) => {
          console.error('Error fetching clients', error);
        }
      );
  }

  submitForm() {
    // Format the deadline correctly
    const deadlineDateTime = this.project.deadline ? new Date(this.project.deadline).toISOString() : null;

    // Construct the payload
    const payload = {
      name: this.project.name,
      description: this.project.description,
      client: this.project.client ? {id: this.project.client.id} : null,
      deadline: deadlineDateTime // Send the formatted deadline
    };

    console.log('Payload being sent:', payload); // Add this line to debug

    // Send the request to the backend
    this.http.post<any>('http://localhost:8080/api/projects', payload, {withCredentials: true})
      .subscribe(
        (response) => {
          console.log('Project created:', response);
          this.errorMessage = null;
          this.router.navigate(['/workspace']);
        },
        (error) => {
          console.error('Error creating project', error);
          this.errorMessage = 'Failed to create project. Please try again.';
        }
      );
  }
}

interface Client {
  id: string;
  name: string;
}
