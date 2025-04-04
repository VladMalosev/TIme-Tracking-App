import { TestBed } from '@angular/core/testing';

import { TimeEntryStateService } from './time-entry-state.service';

describe('TimeEntryStateService', () => {
  let service: TimeEntryStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeEntryStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
