import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTimeLogListComponent } from './project-time-log-list.component';

describe('ProjectTimeLogListComponent', () => {
  let component: ProjectTimeLogListComponent;
  let fixture: ComponentFixture<ProjectTimeLogListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTimeLogListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTimeLogListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
