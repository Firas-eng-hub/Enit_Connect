import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorNavbarComponent } from './visitor-navbar.component';

describe('VisitorNavbarComponent', () => {
  let component: VisitorNavbarComponent;
  let fixture: ComponentFixture<VisitorNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisitorNavbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisitorNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
