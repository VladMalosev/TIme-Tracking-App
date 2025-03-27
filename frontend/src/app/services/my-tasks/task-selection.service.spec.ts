import { TestBed } from '@angular/core/testing';

import { TaskSelectionService } from './task-selection.service';

describe('TaskSelectionService', () => {
  let service: TaskSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
