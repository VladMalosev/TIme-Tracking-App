import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogTimeComponent } from './log-time.component';

describe('LogTimeComponent', () => {
  let component: LogTimeComponent;
  let fixture: ComponentFixture<LogTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
