import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { TaskService } from '../../../services/main-dashboard/task.service';
import { Task } from '../../../models/main-dashboard';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatIcon} from '@angular/material/icon';

interface CalendarDay {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
}

interface PopoverData {
  date: Date;
  tasks: Task[];
  day: CalendarDay;
}

interface Position {
  top: number;
  left: number;
}

@Component({
  selector: 'app-upcoming-deadlines',
  standalone: true,
  imports: [CommonModule, MatMenuModule, RouterModule, MatTooltipModule, MatIcon],
  templateUrl: './upcoming-deadlines.component.html',
  styleUrls: ['./upcoming-deadlines.component.css']
})
export class UpcomingDeadlinesComponent implements OnInit, OnDestroy {
  upcomingTasks: Task[] = [];
  calendarDays: CalendarDay[] = [];
  isLoading = true;
  error: string | null = null;
  private subscriptions = new Subscription();

  today = new Date();
  currentMonth = new Date();
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  activePopover: PopoverData | null = null;
  popoverPosition: Position = { top: 0, left: 0 };

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchUpcomingTasks();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.closePopover();
  }

  fetchUpcomingTasks(): void {
    this.isLoading = true;
    this.error = null;

    const userSub = this.authService.userId$.subscribe(userId => {
      if (userId) {
        const taskSub = this.taskService.getTasksWithDeadlines(userId).subscribe({
          next: (tasks) => {
            this.upcomingTasks = this.sortTasksByDeadline(tasks);
            this.generateCalendarDays();
            this.isLoading = false;
          },
          error: (err) => {
            this.error = 'Failed to fetch upcoming tasks';
            this.isLoading = false;
            console.error('Error fetching tasks:', err);
          }
        });
        this.subscriptions.add(taskSub);
      } else {
        this.isLoading = false;
        this.error = 'User not authenticated';
      }
    });
    this.subscriptions.add(userSub);
  }

  sortTasksByDeadline(tasks: Task[]): Task[] {
    return tasks
      .filter(task => task.deadline !== undefined)
      .sort((a, b) => {
        const dateA = new Date(a.deadline!).getTime();
        const dateB = new Date(b.deadline!).getTime();
        return dateA - dateB;
      });
  }

  generateCalendarDays(): void {
    this.calendarDays = [];

    const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);

    const firstDayOfWeek = firstDay.getDay();

    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonth = new Date(this.currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthLastDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();

    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonthLastDay - i);
      this.addCalendarDay(date, false);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), i);
      this.addCalendarDay(date, true);
    }

    const totalDaysNeeded = 42;
    const daysFromNextMonth = totalDaysNeeded - this.calendarDays.length;
    const nextMonth = new Date(this.currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
      this.addCalendarDay(date, false);
    }
  }

  addCalendarDay(date: Date, isCurrentMonth: boolean): void {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const tasksForDay = this.upcomingTasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return taskDate.getDate() === normalizedDate.getDate() &&
        taskDate.getMonth() === normalizedDate.getMonth() &&
        taskDate.getFullYear() === normalizedDate.getFullYear();
    });

    this.calendarDays.push({
      date: normalizedDate,
      tasks: tasksForDay,
      isCurrentMonth: isCurrentMonth
    });
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendarDays();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendarDays();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  hasOverdueTasks(day: CalendarDay): boolean {
    return day.tasks.some(task => this.isOverdue(task));
  }

  hasDueSoonTasks(day: CalendarDay): boolean {
    return day.tasks.some(task => this.isDueSoon(task));
  }

  isOverdue(task: Task): boolean {
    if (!task.deadline) return false;
    const now = new Date();
    const deadline = new Date(task.deadline);
    return deadline < now;
  }

  isDueSoon(task: Task): boolean {
    if (!task.deadline) return false;
    const now = new Date();
    const deadline = new Date(task.deadline);

    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffTime > 0 && diffDays <= 3;
  }

  getTaskDueStatus(task: Task): string {
    if (!task.deadline) return '';

    const now = new Date();
    const deadline = new Date(task.deadline);

    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) {
      return 'overdue';
    } else if (diffDays <= 3) {
      return 'due-soon';
    } else {
      return '';
    }
  }

  viewTaskDetails(task: Task): void {
    this.goToTask(task);
  }

  showMoreTasks(day: CalendarDay, event?: MouseEvent): void {
    this.closePopover();

    this.activePopover = {
      date: day.date,
      tasks: day.tasks,
      day: day
    };

    if (event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      this.popoverPosition = {
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX - 100
      };
    } else {
      this.popoverPosition = {
        top: 100,
        left: 100
      };
    }

    setTimeout(() => {
      const popover = document.querySelector('.task-popover') as HTMLElement;
      if (popover) {
        const rect = popover.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          this.popoverPosition.left = window.innerWidth - rect.width - 10;
        }
        if (rect.bottom > window.innerHeight) {
          this.popoverPosition.top = window.innerHeight - rect.height - 10;
        }
      }
    }, 0);
  }

  closePopover(): void {
    this.activePopover = null;
  }

  @HostListener('document:click', ['$event'])
  closePopoverOnOutsideClick(event: MouseEvent): void {
    const popover = document.querySelector('.task-popover');
    const moreBtn = document.querySelector('.more-tasks');

    if (this.activePopover &&
      popover &&
      !popover.contains(event.target as Node) &&
      moreBtn &&
      !moreBtn.contains(event.target as Node)) {
      this.closePopover();
    }
  }


  goToTask(task: Task): void {
    if (!task.id || !task.project?.id) {
      this.snackBar.open('Task or project information is missing', 'Close', { duration: 3000 });
      return;
    }

    this.router.navigate([
      '/project-details',
      task.project.id,
      'dashboard'
    ], {
      queryParams: {
        tab: 'tasks',
        subTab: 'assigned-tasks',
        taskTab: 'my-tasks',
        taskId: task.id
      }
    });
  }

  goToProject(task: Task): void {
    if (!task.project?.id) {
      this.snackBar.open('Project information is missing', 'Close', { duration: 3000 });
      return;
    }

    this.router.navigate([
      '/project-details',
      task.project.id,
      'dashboard'
    ]);
  }
}
