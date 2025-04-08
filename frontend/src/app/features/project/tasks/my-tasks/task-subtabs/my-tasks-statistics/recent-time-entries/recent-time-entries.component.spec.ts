import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentTimeEntriesComponent } from './recent-time-entries.component';

describe('RecentTimeEntriesComponent', () => {
  let component: RecentTimeEntriesComponent;
  let fixture: ComponentFixture<RecentTimeEntriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentTimeEntriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentTimeEntriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
