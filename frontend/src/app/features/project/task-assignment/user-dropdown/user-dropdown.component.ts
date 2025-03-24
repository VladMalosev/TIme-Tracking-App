import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dropdown.component.html',
  styleUrls: ['./user-dropdown.component.css']
})
export class UserDropdownComponent implements AfterViewInit {
  @Input() users: any[] = [];
  @Input() defaultText: string = 'Select User';
  @Output() userSelected = new EventEmitter<any>();

  @ViewChild('dropdownTrigger') dropdownTrigger!: ElementRef;
  dropdownInstance: any;

  selectedUser: any = null;

  ngAfterViewInit(): void {
    setTimeout(() => {
      const elems = this.dropdownTrigger.nativeElement;
    });
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.userSelected.emit(user);
    this.closeDropdown();
  }

  closeDropdown(): void {
    if (this.dropdownInstance) {
      this.dropdownInstance.close();
    }
  }
}
