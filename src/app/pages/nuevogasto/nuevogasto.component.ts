import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonButtons, IonButton, IonIcon, IonHeader, IonToolbar, IonContent, IonTitle,
  IonBackButton, IonItem, IonInput, IonSelect, IonSelectOption,
  IonLabel, IonSegment, IonSegmentButton, IonTextarea, IonRow, IonCol,
  ViewDidEnter
} from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { personCircle, qrCodeOutline } from 'ionicons/icons';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-nuevogasto',
  templateUrl: './nuevogasto.component.html',
  styleUrls: ['./nuevogasto.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonButtons,
    IonButton,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonContent,
    IonTitle,
    IonBackButton,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonTextarea,
    IonRow,
    IonCol
  ],
})
export class NuevogastoComponent implements OnInit, ViewDidEnter {
  gastoForm: FormGroup;
  modoEdicion = false;
  gastoId: number | null = null;
  /** true cuando se llega desde el escáner con datos de IA */
  desdeIA = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ personCircle, qrCodeOutline });

    this.gastoForm = this.fb.group({
      concepto: ['', Validators.required],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      categoria: ['', Validators.required],
      metodoPago: ['efectivo', Validators.required],
      notas: ['']
    });
  }

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.modoEdicion = true;
      this.gastoId = Number(idParam);
      await this.cargarGasto(this.gastoId);
      return;
    }
  }

  /**
   * ionViewDidEnter se ejecuta cuando la página está completamente visible
   * y los componentes ion-input ya están inicializados en el DOM.
   * Aquí es seguro hacer patchValue para que se reflejen los datos.
   */
  ionViewDidEnter() {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('desde_ia') === 'true') {
      this.desdeIA = true;
      const montoStr = qp.get('monto');

      // Usar setTimeout para asegurar que los ion-input estén listos
      setTimeout(() => {
        this.gastoForm.patchValue({
          concepto:   qp.get('concepto')   ?? '',
          monto:      montoStr ? parseFloat(montoStr) : null,
          fecha:      qp.get('fecha')      ?? new Date().toISOString().split('T')[0],
          categoria:  qp.get('categoria')  ?? '',
          metodoPago: qp.get('metodoPago') ?? 'efectivo',
          notas:      qp.get('notas')      ?? '',
        });

        // Forzar actualización de validadores y UI
        this.gastoForm.markAllAsTouched();
        this.gastoForm.updateValueAndValidity();
        this.cdr.detectChanges();
      }, 100);
    }
  }

  async cargarGasto(id: number) {
    try {
      const gasto = await this.supabase.obtenerGastoPorId(id);
      if (gasto) {
        // Reverse map categoria_id to string
        let categoria = 'comida';
        if (gasto.categoria_id === 2) categoria = 'transporte';
        if (gasto.categoria_id === 3) categoria = 'servicios';
        if (gasto.categoria_id === 4) categoria = 'entretenimiento';
        if (gasto.categoria_id === 5) categoria = 'otros';

        // Reverse map metodo_pago_id to string
        let metodoPago = 'efectivo';
        if (gasto.metodo_pago_id === 2) metodoPago = 'tarjeta';
        if (gasto.metodo_pago_id === 3) metodoPago = 'transferencia';

        this.gastoForm.patchValue({
          concepto: gasto.concepto,
          monto: gasto.monto,
          fecha: gasto.fecha_gasto,
          categoria,
          metodoPago,
          notas: gasto.notas || ''
        });
      }
    } catch (error) {
      console.error('Error cargando gasto para editar:', error);
    }
  }

  async guardar() {
    if (this.gastoForm.valid) {
      const vals = this.gastoForm.value;

      // Mapeo temporal de categorías y métodos a IDs numéricos
      let categoriaId = 1;
      if (vals.categoria === 'transporte') categoriaId = 2;
      if (vals.categoria === 'servicios') categoriaId = 3;
      if (vals.categoria === 'entretenimiento') categoriaId = 4;
      if (vals.categoria === 'otros') categoriaId = 5;

      let metodoId = 1;
      if (vals.metodoPago === 'tarjeta') metodoId = 2;
      if (vals.metodoPago === 'transferencia') metodoId = 3;

      try {
        const gastoData = {
          concepto: vals.concepto,
          monto: vals.monto,
          fecha_gasto: vals.fecha,
          categoria_id: categoriaId,
          metodo_pago_id: metodoId,
          notas: vals.notas
        };

        if (this.modoEdicion && this.gastoId) {
          await this.supabase.actualizarGasto(this.gastoId, gastoData);
          console.log('Gasto actualizado exitosamente');
        } else {
          await this.supabase.insertarGasto(gastoData);
          console.log('Gasto guardado exitosamente');
        }

        this.router.navigate(['/gastos']);
      } catch (error) {
        console.error('Error al guardar', error);
        alert('Ocurrió un error al guardar el gasto. Revisa la consola para más detalles.');
      }
    } else {
      this.gastoForm.markAllAsTouched();
    }
  }

  cancelar() {
    if (this.modoEdicion) {
      this.router.navigate(['/gastos']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
