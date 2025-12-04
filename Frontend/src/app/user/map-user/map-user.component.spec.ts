import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapUserComponent } from './map-user.component';

describe('MapUserComponent', () => {
  let component: MapUserComponent;
  let fixture: ComponentFixture<MapUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MapUserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
