import { Component, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonFab, IonFabButton, IonIcon, IonButtons, IonButton
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  add, calendarOutline, chevronForwardOutline, notificationsOutline,
  personCircle, qrCodeOutline, trendingUpOutline,
  walletOutline, cafeOutline, carOutline, receiptOutline, filmOutline, cogOutline,
  pricetagOutline, restaurantOutline, medkitOutline, schoolOutline, homeOutline,
  airplaneOutline, cartOutline, giftOutline, fitnessOutline,
  pawOutline, constructOutline, musicalNotesOutline, bookOutline,
  busOutline, flashOutline, gameControllerOutline, layersOutline
} from 'ionicons/icons';
import { SupabaseService, Gasto } from '../services/supabase.service';
import { FiltroMesService } from '../services/filtro-mes.service';
import { CategoriasService } from '../services/categorias.service';
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
  /** Signal con todos los gastos del mes seleccionado */
  gastosDelMes = signal<Gasto[]>([]);

  /** Signal con los últimos 5 gastos del mes seleccionado */
  gastosRecientes = signal<Gasto[]>([]);

  /** Computed: suma total del mes */
  totalMes = computed(() =>
    this.gastosDelMes().reduce((sum, g) => sum + Number(g.monto), 0)
  );

  /** Computed: suma de los gastos de hoy (solo si el mes actual está seleccionado) */
  totalHoy = computed(() => {
    if (!this.filtroMes.esMesActual()) return 0;
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
    return this.categoriasService.getNombre(maxId);
  });

  /** Computed: icono de la categoría más frecuente del mes */
  topCategoriaIcon = computed(() => {
    const gastos = this.gastosDelMes();
    if (gastos.length === 0) return 'wallet-outline';

    const conteo = new Map<number, number>();
    for (const g of gastos) {
      conteo.set(g.categoria_id, (conteo.get(g.categoria_id) ?? 0) + 1);
    }
    let maxId = 1;
    let maxCount = 0;
    for (const [id, count] of conteo) {
      if (count > maxCount) { maxId = id; maxCount = count; }
    }
    return this.categoriasService.getIcono(maxId);
  });

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    public filtroMes: FiltroMesService,
    private categoriasService: CategoriasService
  ) {
    addIcons({
      add, calendarOutline, chevronForwardOutline, notificationsOutline,
      personCircle, qrCodeOutline, trendingUpOutline,
      walletOutline, cafeOutline, carOutline, receiptOutline, filmOutline, cogOutline,
      pricetagOutline, restaurantOutline, medkitOutline, schoolOutline, homeOutline,
      airplaneOutline, cartOutline, giftOutline, fitnessOutline,
      pawOutline, constructOutline, musicalNotesOutline, bookOutline,
      busOutline, flashOutline, gameControllerOutline, layersOutline
    });

    // Recargar datos automáticamente cuando cambie el mes
    effect(() => {
      this.filtroMes.mes();
      this.filtroMes.anio();
      this.cargarDatos();
    });
  }

  async ionViewWillEnter() {
    await this.categoriasService.cargarCategorias();
    await this.cargarDatos();
  }

  async cargarDatos() {
    try {
      const mes = this.filtroMes.mes();
      const anio = this.filtroMes.anio();
      const [gastosMes, recientes] = await Promise.all([
        this.supabase.obtenerGastosPorMes(mes, anio),
        this.supabase.obtenerGastosRecientesPorMes(mes, anio)
      ]);
      this.gastosDelMes.set(gastosMes);
      this.gastosRecientes.set(recientes);
    } catch (error) {
      console.error('Error al cargar datos', error);
    }
  }

  getIconForCategory(categoryId: number): string {
    return this.categoriasService.getIcono(categoryId);
  }

  getCategoryName(categoryId: number): string {
    return this.categoriasService.getNombre(categoryId);
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
