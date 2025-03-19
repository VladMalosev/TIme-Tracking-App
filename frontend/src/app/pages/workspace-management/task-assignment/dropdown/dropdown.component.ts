import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
declare const M: any;

@Component({
  selector: 'app-dropdown',
  imports: [CommonModule],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.css'
})
export class DropdownComponent implements AfterViewInit {
  @Input() items: any[] = [];
  @Input() displayKey: string = 'name';
  @Input() defaultText: string = 'Select an option';
  @Output() itemSelected = new EventEmitter<any>();

  @ViewChild('dropdownTrigger') dropdownTrigger!: ElementRef;
  dropdownInstance: any;

  selectedItem: any = null;

  ngAfterViewInit(): void {
    setTimeout(() => {
      // Initialize the dropdown
      const elems = this.dropdownTrigger.nativeElement;
      this.dropdownInstance = M.Dropdown.init(elems, {
        coverTrigger: false,
        closeOnClick: false
      });
    });
  }

  selectItem(item: any): void {
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
