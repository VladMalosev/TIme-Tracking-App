import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeLogListComponent } from './time-log-list.component';

describe('TimeLogListComponent', () => {
  let component: TimeLogListComponent;
  let fixture: ComponentFixture<TimeLogListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeLogListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeLogListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
