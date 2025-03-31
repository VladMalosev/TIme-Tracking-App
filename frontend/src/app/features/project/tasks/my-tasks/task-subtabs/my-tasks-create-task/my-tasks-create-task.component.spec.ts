import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyTasksCreateTaskComponent } from './my-tasks-create-task.component';

describe('MyTasksCreateTaskComponent', () => {
  let component: MyTasksCreateTaskComponent;
  let fixture: ComponentFixture<MyTasksCreateTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyTasksCreateTaskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyTasksCreateTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
