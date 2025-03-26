import { TestBed } from '@angular/core/testing';

import { SelfTaskService } from './self-task.service';

describe('SelfTaskService', () => {
  let service: SelfTaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelfTaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
