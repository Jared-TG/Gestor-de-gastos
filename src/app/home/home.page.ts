import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonFab, IonFabButton, IonIcon, IonButtons, IonButton
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  add, calendarOutline, chevronForwardOutline, notificationsOutline,
  personCircle, qrCodeOutline, restaurantOutline, trendingUpOutline,
  walletOutline, cartOutline, busOutline, cafeOutline
} from 'ionicons/icons';
import { SupabaseService, Gasto } from '../services/supabase.service';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonContent, IonFab, IonFabButton,
    IonIcon, IonButtons, IonButton, IonTitle, RouterModule,
    CurrencyPipe, DatePipe
  ],
})
export class HomePage {
  /** Signal con todos los gastos del mes actual */
  gastosDelMes = signal<Gasto[]>([]);

  /** Signal con los últimos 5 gastos */
  gastosRecientes = signal<Gasto[]>([]);

  /** Computed: suma total del mes */
  totalMes = computed(() =>
    this.gastosDelMes().reduce((sum, g) => sum + Number(g.monto), 0)
  );

  /** Computed: suma de los gastos de hoy */
  totalHoy = computed(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return this.gastosDelMes()
      .filter(g => g.fecha_gasto === hoy)
      .reduce((sum, g) => sum + Number(g.monto), 0);
  });

  /** Computed: conteo total de gastos del mes */
  conteoGastos = computed(() => this.gastosDelMes().length);

  /** Computed: categoría más frecuente del mes */
  topCategoria = computed(() => {
    const gastos = this.gastosDelMes();
    if (gastos.length === 0) return '—';

    const conteo = new Map<number, number>();
    for (const g of gastos) {
      conteo.set(g.categoria_id, (conteo.get(g.categoria_id) ?? 0) + 1);
    }
    let maxId = 1;
    let maxCount = 0;
    for (const [id, count] of conteo) {
      if (count > maxCount) { maxId = id; maxCount = count; }
    }
    return this.getCategoryName(maxId);
  });

  constructor(
    private router: Router,
    private supabase: SupabaseService
  ) {
    addIcons({
      add, calendarOutline, chevronForwardOutline, notificationsOutline,
      personCircle, restaurantOutline, qrCodeOutline, trendingUpOutline,
      walletOutline, cartOutline, busOutline, cafeOutline
    });
  }

  async ionViewWillEnter() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    try {
      const [mes, recientes] = await Promise.all([
        this.supabase.obtenerGastosDelMes(),
        this.supabase.obtenerGastosRecientes()
      ]);
      this.gastosDelMes.set(mes);
      this.gastosRecientes.set(recientes);
    } catch (error) {
      console.error('Error al cargar datos', error);
    }
  }

  getIconForCategory(categoryId: number): string {
    switch (categoryId) {
      case 1: return 'restaurant-outline';
      case 2: return 'bus-outline';
      case 3: return 'cart-outline';
      default: return 'wallet-outline';
    }
  }

  getCategoryName(categoryId: number): string {
    switch (categoryId) {
      case 1: return 'Comida';
      case 2: return 'Transporte';
      case 3: return 'Servicios';
      case 4: return 'Entretenim.';
      default: return 'Otros';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  addGasto() {
    this.router.navigate(['/nuevogasto']);
  }
}
