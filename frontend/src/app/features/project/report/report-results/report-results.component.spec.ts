import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportResultsComponent } from './report-results.component';

describe('ReportResultsComponent', () => {
  let component: ReportResultsComponent;
  let fixture: ComponentFixture<ReportResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportResultsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
