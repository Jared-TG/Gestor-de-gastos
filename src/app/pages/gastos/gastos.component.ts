import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButtons, IonButton,
  IonSearchbar, IonFab, IonFabButton, AlertController
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  searchOutline, calendarOutline, walletOutline,
  cafeOutline, carOutline, receiptOutline, filmOutline, cogOutline,
  createOutline, trashOutline, add, ellipsisVertical, personCircle
} from 'ionicons/icons';
import { SupabaseService, Gasto } from '../../services/supabase.service';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gastos',
  templateUrl: './gastos.component.html',
  styleUrls: ['./gastos.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonIcon,
    IonButtons, IonButton, IonSearchbar, IonFab, IonFabButton,
    RouterModule, CurrencyPipe, FormsModule
  ],
})
export class GastosComponent {
  /** Todos los gastos cargados de Supabase */
  todosLosGastos = signal<Gasto[]>([]);

  /** Término de búsqueda */
  terminoBusqueda = signal<string>('');

  /** Filtro de categoría seleccionado (0 = Todos) */
  categoriaFiltro = signal<number>(0);

  /** Filtros disponibles para los chips */
  filtrosCategoria = [
    { id: 0, nombre: 'Todos' },
    { id: 1, nombre: 'Comida' },
    { id: 2, nombre: 'Transporte' },
    { id: 3, nombre: 'Servicios' },
    { id: 4, nombre: 'Entretenimiento' },
    { id: 5, nombre: 'Otros' },
  ];

  /** Gastos filtrados según búsqueda y categoría */
  gastosFiltrados = computed(() => {
    let gastos = this.todosLosGastos();
    const termino = this.terminoBusqueda().toLowerCase().trim();
    const categoriaId = this.categoriaFiltro();

    if (termino) {
      gastos = gastos.filter(g =>
        g.concepto.toLowerCase().includes(termino)
      );
    }

    if (categoriaId > 0) {
      gastos = gastos.filter(g => g.categoria_id === categoriaId);
    }

    return gastos;
  });

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    private alertCtrl: AlertController
  ) {
    addIcons({
      searchOutline, calendarOutline, walletOutline,
      cafeOutline, carOutline, receiptOutline, filmOutline, cogOutline,
      createOutline, trashOutline, add, ellipsisVertical, personCircle
    });
  }

  async ionViewWillEnter() {
    await this.cargarGastos();
  }

  async cargarGastos() {
    try {
      const gastos = await this.supabase.obtenerTodosLosGastos();
      this.todosLosGastos.set(gastos);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    }
  }

  onBuscar(event: any) {
    this.terminoBusqueda.set(event.detail.value || '');
  }

  seleccionarCategoria(id: number) {
    this.categoriaFiltro.set(id);
  }

  editarGasto(gasto: Gasto) {
    this.router.navigate(['/nuevogasto', gasto.id]);
  }

  async confirmarEliminar(gasto: Gasto) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar gasto',
      message: `¿Estás seguro de eliminar "${gasto.concepto}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.eliminarGasto(gasto);
          }
        }
      ]
    });
    await alert.present();
  }

  async eliminarGasto(gasto: Gasto) {
    try {
      if (gasto.id) {
        await this.supabase.eliminarGasto(gasto.id);
        // Refresh the list
        await this.cargarGastos();
      }
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
    }
  }

  agregarGasto() {
    this.router.navigate(['/nuevogasto']);
  }

  getIconForCategory(categoryId: number): string {
    switch (categoryId) {
      case 1: return 'cafe-outline';
      case 2: return 'car-outline';
      case 3: return 'receipt-outline';
      case 4: return 'film-outline';
      case 5: return 'cog-outline';
      default: return 'wallet-outline';
    }
  }

  getCategoryName(categoryId: number): string {
    switch (categoryId) {
      case 1: return 'Comida';
      case 2: return 'Transporte';
      case 3: return 'Servicios';
      case 4: return 'Entretenimiento';
      case 5: return 'Otros';
      default: return 'Otros';
    }
  }

  getCategoryColor(categoryId: number): string {
    switch (categoryId) {
      case 1: return '#e74c3c';
      case 2: return '#3498db';
      case 3: return '#f39c12';
      case 4: return '#2ecc71';
      case 5: return '#9b59b6';
      default: return '#95a5a6';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  }
}
