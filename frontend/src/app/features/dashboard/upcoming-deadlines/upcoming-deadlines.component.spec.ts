import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingDeadlinesComponent } from './upcoming-deadlines.component';

describe('UpcomingDeadlinesComponent', () => {
  let component: UpcomingDeadlinesComponent;
  let fixture: ComponentFixture<UpcomingDeadlinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingDeadlinesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpcomingDeadlinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
