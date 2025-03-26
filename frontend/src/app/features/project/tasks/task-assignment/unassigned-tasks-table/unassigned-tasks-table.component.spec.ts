import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnassignedTasksTableComponent } from './unassigned-tasks-table.component';

describe('UnassignedTasksTableComponent', () => {
  let component: UnassignedTasksTableComponent;
  let fixture: ComponentFixture<UnassignedTasksTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnassignedTasksTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnassignedTasksTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
