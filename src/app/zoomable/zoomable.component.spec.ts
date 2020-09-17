import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomableComponent } from './zoomable.component';

describe('ZoomableComponent', () => {
  let component: ZoomableComponent;
  let fixture: ComponentFixture<ZoomableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ZoomableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoomableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
