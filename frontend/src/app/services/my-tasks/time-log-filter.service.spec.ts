import { TestBed } from '@angular/core/testing';

import { TimeLogFilterService } from './time-log-filter.service';

describe('TimeLogFilterService', () => {
  let service: TimeLogFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeLogFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
