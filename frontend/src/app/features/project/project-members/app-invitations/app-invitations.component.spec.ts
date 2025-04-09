import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppInvitationsComponent } from './app-invitations.component';

describe('AppInvitationsComponent', () => {
  let component: AppInvitationsComponent;
  let fixture: ComponentFixture<AppInvitationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppInvitationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppInvitationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
