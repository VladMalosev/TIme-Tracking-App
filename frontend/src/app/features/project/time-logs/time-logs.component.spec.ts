import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeLogsComponent } from './time-logs.component';

describe('TimeLogsComponent', () => {
  let component: TimeLogsComponent;
  let fixture: ComponentFixture<TimeLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeLogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
