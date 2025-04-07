import { Component, Output, EventEmitter } from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
  imports: [
    MatIcon,
    MatButton
  ],
  styleUrls: ['./quick-actions.component.scss']
})
export class QuickActionsComponent {
showTasks = new EventEmitter<void>();
logProjectTime = new EventEmitter<void>();
viewReports = new EventEmitter<void>();
}
