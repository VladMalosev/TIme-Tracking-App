import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberActivityLogsComponent } from './member-activity-logs.component';

describe('MemberActivityLogsComponent', () => {
  let component: MemberActivityLogsComponent;
  let fixture: ComponentFixture<MemberActivityLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberActivityLogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberActivityLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
