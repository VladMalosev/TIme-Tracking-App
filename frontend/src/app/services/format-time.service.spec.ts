import { TestBed } from '@angular/core/testing';

import { FormatTimeService } from './format-time.service';

describe('FormatTimeService', () => {
  let service: FormatTimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormatTimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
