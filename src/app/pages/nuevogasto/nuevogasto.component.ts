import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonButtons, IonButton, IonIcon, IonHeader, IonToolbar, IonContent, IonTitle,
  IonBackButton, IonInput, IonSelect, IonSelectOption,
  IonTextarea, IonRow, IonCol,
  ViewDidEnter, AlertController
} from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { personCircle, qrCodeOutline, addCircleOutline } from 'ionicons/icons';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { CategoriasService } from '../../services/categorias.service';

@Component({
  selector: 'app-nuevogasto',
  templateUrl: './nuevogasto.component.html',
  styleUrls: ['./nuevogasto.component.scss'],
  standalone: true,
  imports: [
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
    IonInput,
    IonSelect,
    IonSelectOption,
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
    private cdr: ChangeDetectorRef,
    private alertCtrl: AlertController,
    public categoriasService: CategoriasService
  ) {
    addIcons({ personCircle, qrCodeOutline, addCircleOutline });

    this.gastoForm = this.fb.group({
      concepto: ['', Validators.required],
      monto: [null, [Validators.required, Validators.min(0.01)]],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      categoria: [null, Validators.required],  // ahora es un ID numérico
      metodoPago: ['efectivo', Validators.required],
      notas: ['']
    });
  }

  async ngOnInit() {
    // Cargar categorías desde Supabase
    await this.categoriasService.cargarCategorias();

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

      // Mapear categoría string del IA a ID numérico
      const catString = qp.get('categoria') ?? '';
      const catId = this.mapCategoriaStringToId(catString);

      // Usar setTimeout para asegurar que los ion-input estén listos
      setTimeout(() => {
        this.gastoForm.patchValue({
          concepto:   qp.get('concepto')   ?? '',
          monto:      montoStr ? parseFloat(montoStr) : null,
          fecha:      qp.get('fecha')      ?? new Date().toISOString().split('T')[0],
          categoria:  catId,
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

  /** Mapea un string de categoría (de la IA) al ID numérico */
  private mapCategoriaStringToId(catStr: string): number | null {
    if (!catStr) return null;
    const lower = catStr.toLowerCase();
    const cat = this.categoriasService.categorias().find(
      c => c.nombre.toLowerCase() === lower
    );
    return cat?.id ?? null;
  }

  async cargarGasto(id: number) {
    try {
      const gasto = await this.supabase.obtenerGastoPorId(id);
      if (gasto) {
        // Reverse map metodo_pago_id to string
        let metodoPago = 'efectivo';
        if (gasto.metodo_pago_id === 2) metodoPago = 'tarjeta';
        if (gasto.metodo_pago_id === 3) metodoPago = 'transferencia';

        this.gastoForm.patchValue({
          concepto: gasto.concepto,
          monto: gasto.monto,
          fecha: gasto.fecha_gasto,
          categoria: gasto.categoria_id,  // ahora usa el ID directamente
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

      // categoria ya es un ID numérico
      const categoriaId = vals.categoria;

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

  /** Maneja el cambio en el select de categoría */
  onCategoriaChange(event: any) {
    const valor = event.detail.value;
    if (valor === '__nueva__') {
      // Resetear el select para que no quede seleccionado "__nueva__"
      this.gastoForm.patchValue({ categoria: null });
      this.abrirModalNuevaCategoria();
    }
  }

  /** Abre un alert para crear una nueva categoría */
  async abrirModalNuevaCategoria() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva categoría',
      message: 'Escribe el nombre de la nueva categoría de gasto.',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Ej: Educación, Salud, Mascotas...',
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async (data) => {
            const nombre = data.nombre?.trim();
            if (!nombre) return false; // no cerrar si está vacío

            const nueva = await this.categoriasService.crearCategoria(nombre);
            if (nueva && nueva.id) {
              // Seleccionar la nueva categoría automáticamente
              setTimeout(() => {
                this.gastoForm.patchValue({ categoria: nueva.id });
                this.cdr.detectChanges();
              }, 100);
            }
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  cancelar() {
    if (this.modoEdicion) {
      this.router.navigate(['/gastos']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
