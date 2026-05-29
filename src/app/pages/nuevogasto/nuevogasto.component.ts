import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { 
  IonButtons, IonButton, IonIcon, IonHeader, IonToolbar, IonContent, IonTitle, 
  IonBackButton, IonItem, IonInput, IonSelect, IonSelectOption, 
  IonLabel, IonSegment, IonSegmentButton, IonTextarea, IonRow, IonCol 
} from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { personCircle } from 'ionicons/icons';

@Component({
  selector: 'app-nuevogasto',
  templateUrl: './nuevogasto.component.html',
  styleUrls: ['./nuevogasto.component.scss'],
  standalone: true,
  imports: [
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

  constructor(private fb: FormBuilder) {
    addIcons({
      personCircle
    });

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

  guardar() {
    if (this.gastoForm.valid) {
      console.log('Guardando gasto:', this.gastoForm.value);
      // TODO: Implementar guardado real
    } else {
      this.gastoForm.markAllAsTouched();
    }
  }

  cancelar() {
    console.log('Cancelar creación de gasto');
    // TODO: Navegar de regreso
  }
}
