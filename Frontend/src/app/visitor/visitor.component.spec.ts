import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorFooterComponent } from './visitor-components/visitor-footer/visitor-footer.component';
import { VisitorNavbarComponent } from './visitor-components/visitor-navbar/visitor-navbar.component';
import { VisitorSidebarComponent } from './visitor-components/visitor-sidebar/visitor-sidebar.component';
import { VisitorComponent } from './visitor.component';

describe('VisitorComponent', () => {
  let component: VisitorComponent;
  let fixture: ComponentFixture<VisitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisitorComponent, VisitorFooterComponent , VisitorNavbarComponent, VisitorSidebarComponent ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


