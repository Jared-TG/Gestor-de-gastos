import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonButtons, IonButton, IonIcon, IonHeader, IonToolbar, IonContent, IonTitle,
  IonBackButton, IonItem, IonInput, IonSelect, IonSelectOption,
  IonLabel, IonSegment, IonSegmentButton, IonTextarea, IonRow, IonCol
} from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { personCircle, qrCodeOutline } from 'ionicons/icons';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

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
export class NuevogastoComponent implements OnInit {
  gastoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
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

  ngOnInit() { }

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
        await this.supabase.insertarGasto({
          concepto: vals.concepto,
          monto: vals.monto,
          fecha_gasto: vals.fecha,
          categoria_id: categoriaId,
          metodo_pago_id: metodoId,
          notas: vals.notas
        });

        console.log('Gasto guardado exitosamente');
        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error al guardar', error);
        alert('Ocurrió un error al guardar el gasto. Revisa la consola para más detalles.');
      }
    } else {
      this.gastoForm.markAllAsTouched();
    }
  }

  cancelar() {
    this.router.navigate(['/home']);
  }
}
