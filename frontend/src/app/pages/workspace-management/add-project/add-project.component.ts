import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-project',
  imports: [CommonModule, FormsModule],
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
    const deadlineDateTime = this.project.deadline ? new Date(this.project.deadline).toISOString() : null;

    const payload = {
      name: this.project.name,
      description: this.project.description,
      client: this.project.client ? {id: this.project.client.id} : null,
      deadline: deadlineDateTime
    };

    console.log('Payload being sent:', payload);

    this.http.post<any>('http://localhost:8080/api/projects', payload, {withCredentials: true})
      .subscribe(
        (response) => {
          console.log('Project created:', response);
          this.errorMessage = null;
          this.router.navigate(['/workspaces']);
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
