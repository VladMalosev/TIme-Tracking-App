import { TestBed } from '@angular/core/testing';

import { QuickActionsService } from './quick-actions.service';

describe('QuickActionsService', () => {
  let service: QuickActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuickActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
