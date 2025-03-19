import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-role-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-dropdown.component.html',
  styleUrls: ['./role-dropdown.component.css']
})
export class RoleDropdownComponent implements AfterViewInit {
  @Input() roles: string[] = [];
  @Output() roleSelected = new EventEmitter<string>();

  @ViewChild('dropdownTrigger') dropdownTrigger!: ElementRef;
  dropdownInstance: any;

  selectedRole: string = 'Select Role';

  ngAfterViewInit(): void {
    setTimeout(() => {
      const elems = this.dropdownTrigger.nativeElement;
    });
  }

  selectRole(role: string): void {
    this.selectedRole = role;
    this.roleSelected.emit(role);
    this.closeDropdown();
  }

  closeDropdown(): void {
    if (this.dropdownInstance) {
      this.dropdownInstance.close();
    }
  }
}
