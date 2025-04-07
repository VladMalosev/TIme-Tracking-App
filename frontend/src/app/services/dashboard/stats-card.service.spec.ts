import { TestBed } from '@angular/core/testing';

import { StatsCardService } from './stats-card.service';

describe('StatsCardService', () => {
  let service: StatsCardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatsCardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
