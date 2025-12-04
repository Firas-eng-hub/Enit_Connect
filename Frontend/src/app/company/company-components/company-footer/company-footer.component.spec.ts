import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyFooterComponent } from './company-footer.component';

describe('CompanyFooterComponent', () => {
  let component: CompanyFooterComponent;
  let fixture: ComponentFixture<CompanyFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyFooterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
