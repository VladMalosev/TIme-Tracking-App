import { TestBed } from '@angular/core/testing';

import { WelcomeCardService } from './welcome-card.service';

describe('WelcomeCardService', () => {
  let service: WelcomeCardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WelcomeCardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
