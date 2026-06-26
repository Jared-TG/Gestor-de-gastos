import { Component, signal, computed, effect } from '@angular/core';
import {
  IonContent, IonHeader, IonToolbar, IonIcon,
  IonButtons, IonButton, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircle, notificationsOutline, statsChartOutline,
  cafeOutline, carOutline, receiptOutline, filmOutline, cogOutline,
  walletOutline, trendingUpOutline, trendingDownOutline,
  checkmarkCircleOutline, arrowUpOutline, pricetagOutline,
  restaurantOutline, medkitOutline, schoolOutline, homeOutline,
  airplaneOutline, cartOutline, giftOutline, fitnessOutline,
  pawOutline, constructOutline, musicalNotesOutline, bookOutline,
  busOutline, flashOutline, gameControllerOutline, layersOutline,
  documentTextOutline
} from 'ionicons/icons';
import { SupabaseService, Gasto } from '../../services/supabase.service';
import { FiltroMesService } from '../../services/filtro-mes.service';
import { CategoriasService } from '../../services/categorias.service';
import { PdfExportService } from '../../services/pdf-export.service';
import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';

export interface CategoriaResumen {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  total: number;
  porcentaje: number;
}

@Component({
  selector: 'app-resumen',
  templateUrl: './resumen.component.html',
  styleUrls: ['./resumen.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonContent, IonIcon,
    IonButtons, IonButton,
    CurrencyPipe, DecimalPipe, PercentPipe
  ],
})
export class ResumenComponent {
  /** All expenses for the selected month */
  gastosDelMes = signal<Gasto[]>([]);

  /** All expenses for the previous month (for comparison) */
  gastosDelMesPasado = signal<Gasto[]>([]);

  /** Exporting state */
  isExporting = signal(false);

  /** Total accumulated this month */
  totalAcumulado = computed(() =>
    this.gastosDelMes().reduce((sum, g) => sum + g.monto, 0)
  );

  /** Total from last month */
  totalMesPasado = computed(() =>
    this.gastosDelMesPasado().reduce((sum, g) => sum + g.monto, 0)
  );

  /** Month-over-month percentage change */
  cambioMensual = computed(() => {
    const pasado = this.totalMesPasado();
    const actual = this.totalAcumulado();
    if (pasado === 0) return actual > 0 ? 100 : 0;
    return ((actual - pasado) / pasado) * 100;
  });

  /** Whether spending increased compared to last month */
  gastoAumento = computed(() => this.cambioMensual() >= 0);

  /** Number of expenses this month */
  conteoGastos = computed(() => this.gastosDelMes().length);

  /** Category breakdown with percentages — now dynamic from CategoriasService */
  categoriasResumen = computed<CategoriaResumen[]>(() => {
    const gastos = this.gastosDelMes();
    const total = this.totalAcumulado();
    if (total === 0) return [];

    const categorias = this.categoriasService.categorias();

    return categorias
      .map(cat => {
        const totalCat = gastos
          .filter(g => g.categoria_id === cat.id)
          .reduce((sum, g) => sum + g.monto, 0);
        return {
          id: cat.id!,
          nombre: cat.nombre,
          icono: cat.icono,
          color: cat.color,
          total: totalCat,
          porcentaje: totalCat / total,
        };
      })
      .filter(cat => cat.total > 0)
      .sort((a, b) => b.total - a.total);
  });

  /** Top spending category */
  topCategoria = computed(() => {
    const cats = this.categoriasResumen();
    return cats.length > 0 ? cats[0] : null;
  });

  /** Donut chart segments for the SVG */
  donutSegments = computed(() => {
    const cats = this.categoriasResumen();
    const segments: { offset: number; length: number; color: string }[] = [];
    let cumulativeOffset = 0;
    const circumference = 2 * Math.PI * 40; // r = 40

    for (const cat of cats) {
      const length = cat.porcentaje * circumference;
      segments.push({
        offset: cumulativeOffset,
        length,
        color: cat.color,
      });
      cumulativeOffset += length;
    }
    return { segments, circumference };
  });

  constructor(
    private supabase: SupabaseService,
    public filtroMes: FiltroMesService,
    private categoriasService: CategoriasService,
    private pdfExportService: PdfExportService,
    private navCtrl: NavController
  ) {
    addIcons({
      personCircle, notificationsOutline, statsChartOutline,
      cafeOutline, carOutline, receiptOutline, filmOutline, cogOutline,
      walletOutline, trendingUpOutline, trendingDownOutline,
      checkmarkCircleOutline, arrowUpOutline, pricetagOutline,
      restaurantOutline, medkitOutline, schoolOutline, homeOutline,
      airplaneOutline, cartOutline, giftOutline, fitnessOutline,
      pawOutline, constructOutline, musicalNotesOutline, bookOutline,
      busOutline, flashOutline, gameControllerOutline, layersOutline,
      documentTextOutline
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

      // Calcular mes anterior al seleccionado
      const mesPasado = mes === 0 ? 11 : mes - 1;
      const anioPasado = mes === 0 ? anio - 1 : anio;

      const [gastosActuales, gastosPasados] = await Promise.all([
        this.supabase.obtenerGastosPorMes(mes, anio),
        this.supabase.obtenerGastosPorMes(mesPasado, anioPasado),
      ]);
      this.gastosDelMes.set(gastosActuales);
      this.gastosDelMesPasado.set(gastosPasados);
    } catch (error) {
      console.error('Error al cargar datos del resumen');
    }
  }

  getNombreMes(): string {
    return this.filtroMes.nombreMes();
  }

  exportarPDF() {
    this.navCtrl.navigateForward('/estados-cuenta');
  }
}
