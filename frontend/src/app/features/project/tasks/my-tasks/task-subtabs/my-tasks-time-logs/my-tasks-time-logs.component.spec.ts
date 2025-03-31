import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyTasksTimeLogsComponent } from './my-tasks-time-logs.component';

describe('MyTasksTimeLogsComponent', () => {
  let component: MyTasksTimeLogsComponent;
  let fixture: ComponentFixture<MyTasksTimeLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyTasksTimeLogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyTasksTimeLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
