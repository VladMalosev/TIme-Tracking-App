import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectInvitationsComponent } from './project-invitations.component';

describe('ProjectInvitationsComponent', () => {
  let component: ProjectInvitationsComponent;
  let fixture: ComponentFixture<ProjectInvitationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectInvitationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectInvitationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
