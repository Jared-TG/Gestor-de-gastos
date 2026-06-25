import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EstadosCuentaComponent } from './estados-cuenta.component';

describe('EstadosCuentaComponent', () => {
  let component: EstadosCuentaComponent;
  let fixture: ComponentFixture<EstadosCuentaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EstadosCuentaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadosCuentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
