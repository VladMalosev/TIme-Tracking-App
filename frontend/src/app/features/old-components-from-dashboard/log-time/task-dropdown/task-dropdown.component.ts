import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-dropdown.component.html',
  styleUrls: ['./task-dropdown.component.css']
})
export class TaskDropdownComponent implements OnInit {
  @Input() tasks: any[] = [];
  @Input() defaultText: string = 'Select a Task';
  @Output() taskSelected = new EventEmitter<any>();

  selectedTask: any = null;
  isOpen: boolean = false;

  ngOnInit(): void {
    console.log('Tasks received in TaskDropdownComponent:', this.tasks);
  }

  onTaskSelect(task: any): void {
    this.selectedTask = task;
    this.taskSelected.emit(task);
    this.isOpen = false;
  }
}
