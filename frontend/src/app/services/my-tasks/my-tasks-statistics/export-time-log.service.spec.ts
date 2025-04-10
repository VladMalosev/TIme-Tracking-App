import { TestBed } from '@angular/core/testing';

import { ExportTimeLogService } from './export-time-log.service';

describe('ExportTimeLogService', () => {
  let service: ExportTimeLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportTimeLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
