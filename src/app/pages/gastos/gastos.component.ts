import { Component, signal, computed, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButtons, IonButton,
  IonSearchbar, IonFab, IonFabButton, AlertController,
  IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  searchOutline, calendarOutline, walletOutline,
  cafeOutline, carOutline, receiptOutline, filmOutline, cogOutline,
  createOutline, trashOutline, add, ellipsisVertical, personCircle,
  chevronBackOutline, chevronForwardOutline, pricetagOutline,
  restaurantOutline, medkitOutline, schoolOutline, homeOutline,
  airplaneOutline, cartOutline, giftOutline, fitnessOutline,
  pawOutline, constructOutline, musicalNotesOutline, bookOutline,
  busOutline, flashOutline, gameControllerOutline, layersOutline
} from 'ionicons/icons';
import { SupabaseService, Gasto } from '../../services/supabase.service';
import { FiltroMesService } from '../../services/filtro-mes.service';
import { CategoriasService } from '../../services/categorias.service';
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
    IonRefresher, IonRefresherContent,
    RouterModule, CurrencyPipe, FormsModule
  ],
})
export class GastosComponent implements OnDestroy {
  /** Todos los gastos cargados de Supabase */
  todosLosGastos = signal<Gasto[]>([]);

  /** Término de búsqueda */
  terminoBusqueda = signal<string>('');

  /** Filtro de categoría seleccionado (0 = Todos) */
  categoriaFiltro = signal<number>(0);

  private dbSub: Subscription;

  /** Filtros disponibles para los chips (dinámico desde el servicio) */
  filtrosCategoria = computed(() => {
    const cats = this.categoriasService.categorias();
    return [{ id: 0, nombre: 'Todos' }, ...cats.map(c => ({ id: c.id!, nombre: c.nombre }))];
  });

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
    private alertCtrl: AlertController,
    public filtroMes: FiltroMesService,
    public categoriasService: CategoriasService
  ) {
    addIcons({
      searchOutline, calendarOutline, walletOutline,
      cafeOutline, carOutline, receiptOutline, filmOutline, cogOutline,
      createOutline, trashOutline, add, ellipsisVertical, personCircle,
      chevronBackOutline, chevronForwardOutline, pricetagOutline,
      restaurantOutline, medkitOutline, schoolOutline, homeOutline,
      airplaneOutline, cartOutline, giftOutline, fitnessOutline,
      pawOutline, constructOutline, musicalNotesOutline, bookOutline,
      busOutline, flashOutline, gameControllerOutline, layersOutline
    });

    // Recargar gastos automáticamente cuando cambie el mes
    effect(() => {
      this.filtroMes.mes();
      this.filtroMes.anio();
      this.cargarGastos();
    });

    // Suscribirse a los cambios en tiempo real de Supabase
    this.dbSub = this.supabase.gastosCambiados$.subscribe(() => {
      this.cargarGastos();
    });
  }

  ngOnDestroy() {
    if (this.dbSub) {
      this.dbSub.unsubscribe();
    }
  }

  async ionViewWillEnter() {
    await this.categoriasService.cargarCategorias();
    await this.cargarGastos();
  }

  async cargarGastos() {
    try {
      const gastos = await this.supabase.obtenerGastosPorMes(
        this.filtroMes.mes(),
        this.filtroMes.anio()
      );
      this.todosLosGastos.set(gastos);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    }
  }

  async handleRefresh(event: any) {
    await this.categoriasService.cargarCategorias();
    await this.cargarGastos();
    event.target.complete();
  }

  onBuscar(event: any) {
    this.terminoBusqueda.set(event.detail.value || '');
  }

  seleccionarCategoria(id: number) {
    this.categoriaFiltro.set(id);
  }

  retrocederMes() {
    this.filtroMes.mesAnterior();
  }

  avanzarMes() {
    this.filtroMes.mesSiguiente();
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
    return this.categoriasService.getIcono(categoryId);
  }

  getCategoryName(categoryId: number): string {
    return this.categoriasService.getNombre(categoryId);
  }

  getCategoryColor(categoryId: number): string {
    return this.categoriasService.getColor(categoryId);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  }
}
