import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyNavbarComponent } from './company-navbar.component';

describe('CompanyNavbarComponent', () => {
  let component: CompanyNavbarComponent;
  let fixture: ComponentFixture<CompanyNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyNavbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
