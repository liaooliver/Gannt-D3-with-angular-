import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeItemComponent } from './node-item.component';

describe('NodeItemComponent', () => {
  let component: NodeItemComponent;
  let fixture: ComponentFixture<NodeItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
