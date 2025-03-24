import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatTableModule} from '@angular/material/table';

@Component({
  selector: 'app-tasklog',
  imports: [CommonModule, FormsModule, MatTableModule],
  templateUrl: './tasklog.component.html',
  styleUrl: './tasklog.component.scss'
})
export class TaskLogComponent {
  @Input() task: any;
  @Input() logs: any[] = [];

  displayedColumns: string[] = ['action', 'user', 'timestamp', 'details'];
}
