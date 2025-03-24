import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.css']
})
export class DropdownComponent implements AfterViewInit {
  @Input() items: any[] = [];
  @Input() displayKey: string = 'name';
  @Input() defaultText: string = 'Select an option';
  @Input() dropdownId: string = 'dropdown';
  @Output() itemSelected = new EventEmitter<any>();

  @ViewChild('dropdownTrigger') dropdownTrigger!: ElementRef;
  dropdownInstance: any;

  selectedItem: any = null;

  ngAfterViewInit(): void {
    setTimeout(() => {
      console.log('Initializing dropdown with items:', this.items); // Log the items
    });
  }

  selectItem(item: any): void {
    console.log('Selected item:', item); // Log the selected item
    this.selectedItem = item;
    this.itemSelected.emit(item);
    this.closeDropdown();
  }

  closeDropdown(): void {
    if (this.dropdownInstance) {
      this.dropdownInstance.close();
    }
  }
}
