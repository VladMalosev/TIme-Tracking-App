import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyTasksStatisticsComponent } from './my-tasks-statistics.component';

describe('MyTasksStatisticsComponent', () => {
  let component: MyTasksStatisticsComponent;
  let fixture: ComponentFixture<MyTasksStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyTasksStatisticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyTasksStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
