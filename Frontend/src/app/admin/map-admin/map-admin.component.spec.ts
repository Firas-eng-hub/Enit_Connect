import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapAdminComponent } from './map-admin.component';

describe('MapAdminComponent', () => {
  let component: MapAdminComponent;
  let fixture: ComponentFixture<MapAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MapAdminComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
