import { TestBed } from '@angular/core/testing';

import { ReportStateService } from './report-state.service';

describe('ReportStateService', () => {
  let service: ReportStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
