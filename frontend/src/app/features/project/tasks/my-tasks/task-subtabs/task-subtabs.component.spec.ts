import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskSubtabsComponent } from './task-subtabs.component';

describe('TaskSubtabsComponent', () => {
  let component: TaskSubtabsComponent;
  let fixture: ComponentFixture<TaskSubtabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskSubtabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskSubtabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
