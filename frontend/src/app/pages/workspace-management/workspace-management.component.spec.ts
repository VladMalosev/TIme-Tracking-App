import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceManagementComponent } from './workspace-management.component';

describe('WorkspaceManagementComponent', () => {
  let component: WorkspaceManagementComponent;
  let fixture: ComponentFixture<WorkspaceManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
