import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonList, IonItem, IonLabel,
  IonIcon, IonButton, IonSpinner, IonItemGroup, IonItemDivider, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, settingsOutline } from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase.service';
import { PdfExportService } from '../../services/pdf-export.service';
import { CategoriasService } from '../../services/categorias.service';
import { Router } from '@angular/router';

interface Periodo {
  mes: number;
  anio: number;
  etiqueta: string;
  isDownloading: boolean;
}

interface AnioAgrupado {
  anio: number;
  periodos: Periodo[];
}

@Component({
  selector: 'app-estados-cuenta',
  templateUrl: './estados-cuenta.component.html',
  styleUrls: ['./estados-cuenta.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonBackButton, IonList, IonItem, IonLabel,
    IonIcon, IonButton, IonSpinner, IonItemGroup, IonItemDivider
  ]
})
export class EstadosCuentaComponent implements OnInit {
  aniosAgrupados = signal<AnioAgrupado[]>([]);
  isLoading = signal(true);

  constructor(
    private supabase: SupabaseService,
    private pdfExportService: PdfExportService,
    private categoriasService: CategoriasService,
    private navCtrl: NavController
  ) {
    addIcons({ downloadOutline, settingsOutline });
  }

  async ngOnInit() {
    await this.cargarPeriodos();
  }

  async cargarPeriodos() {
    this.isLoading.set(true);
    try {
      // Intentamos obtener la fecha del primer gasto primero
      let fechaInicio = await this.supabase.obtenerFechaPrimerGasto();
      
      // Si no hay gastos, caemos en la fecha de creación de la cuenta
      if (!fechaInicio) {
        fechaInicio = await this.supabase.obtenerFechaCreacionCuenta();
      }
      
      // Si por alguna razón no hay ninguna (ej. usuario antiguo sin metadata y sin gastos), usamos el año actual
      if (!fechaInicio) {
        fechaInicio = new Date(new Date().getFullYear(), 0, 1);
      }

      const mesInicio = fechaInicio.getMonth();
      const anioInicio = fechaInicio.getFullYear();
      
      const ahora = new Date();
      const mesFin = ahora.getMonth();
      const anioFin = ahora.getFullYear();

      const periodos: Periodo[] = [];
      
      // Iterar desde el mes de inicio hasta el actual
      let anioActual = anioInicio;
      let mesActual = mesInicio;

      while (anioActual < anioFin || (anioActual === anioFin && mesActual <= mesFin)) {
        periodos.push({
          mes: mesActual,
          anio: anioActual,
          etiqueta: this.obtenerEtiquetaMes(mesActual, anioActual),
          isDownloading: false
        });

        mesActual++;
        if (mesActual > 11) {
          mesActual = 0;
          anioActual++;
        }
      }

      // Ordenar periodos del más reciente al más antiguo
      periodos.sort((a, b) => {
        if (b.anio !== a.anio) return b.anio - a.anio;
        return b.mes - a.mes;
      });

      // Agrupar por año
      const agrupados: Record<number, Periodo[]> = {};
      for (const p of periodos) {
        if (!agrupados[p.anio]) agrupados[p.anio] = [];
        agrupados[p.anio].push(p);
      }

      const arrayAgrupados: AnioAgrupado[] = Object.keys(agrupados)
        .map(anioStr => ({
          anio: parseInt(anioStr, 10),
          periodos: agrupados[parseInt(anioStr, 10)]
        }))
        .sort((a, b) => b.anio - a.anio); // Año más reciente primero

      this.aniosAgrupados.set(arrayAgrupados);

    } catch (error) {
      console.error('Error al cargar periodos:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  obtenerEtiquetaMes(mes: number, anio: number): string {
    const d = new Date(anio, mes, 1);
    const nombre = d.toLocaleDateString('es-MX', { month: 'long' });
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  }

  goBack() {
    this.navCtrl.back();
  }

  async descargarPeriodo(periodo: Periodo) {
    if (periodo.isDownloading) return;
    periodo.isDownloading = true;

    try {
      // 1. Asegurarnos que las categorías estén cargadas
      if (this.categoriasService.categorias().length === 0) {
        await this.categoriasService.cargarCategorias();
      }

      // 2. Obtener gastos del mes específico
      const gastos = await this.supabase.obtenerGastosPorMes(periodo.mes, periodo.anio);
      
      // 3. Calcular totales
      const totalAcumulado = gastos.reduce((sum, g) => sum + g.monto, 0);

      // 4. Calcular resumen de categorías
      const categoriasTodas = this.categoriasService.categorias();
      let categoriasResumen = categoriasTodas
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
            porcentaje: totalAcumulado > 0 ? totalCat / totalAcumulado : 0,
          };
        })
        .filter(cat => cat.total > 0)
        .sort((a, b) => b.total - a.total);

      // 5. Obtener nombre del usuario
      const userName = await this.supabase.obtenerNombreUsuario();

      // 6. Generar PDF
      const etiqueta = `${periodo.etiqueta} ${periodo.anio}`;
      await this.pdfExportService.generarReporte(
        etiqueta,
        totalAcumulado,
        categoriasResumen,
        gastos,
        userName
      );

    } catch (error) {
      console.error('Error al descargar el reporte:', error);
    } finally {
      periodo.isDownloading = false;
    }
  }
}
