import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Platform } from '@ionic/angular/standalone';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TCreatedPdf } from 'pdfmake/build/pdfmake';
import { Gasto } from './supabase.service';
import { CategoriaResumen } from '../pages/resumen/resumen.component';
import { CurrencyPipe, DatePipe } from '@angular/common';

const pdfMakeX = pdfMake as any;
pdfMakeX.vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  private currencyPipe = new CurrencyPipe('en-US');
  private datePipe = new DatePipe('en-US');

  constructor(private platform: Platform) { }

  async generarReporte(
    mesLabel: string,
    totalAcumulado: number,
    categorias: CategoriaResumen[],
    gastos: Gasto[]
  ): Promise<void> {
    const documentDefinition = this.buildDocumentDefinition(
      mesLabel,
      totalAcumulado,
      categorias,
      gastos
    );

    const pdfMakeModule = pdfMake as any;
    let pdfDocGenerator;

    if (pdfMakeModule.createPdf) {
      pdfDocGenerator = pdfMakeModule.createPdf(documentDefinition);
    } else if (pdfMakeModule.default && pdfMakeModule.default.createPdf) {
      pdfDocGenerator = pdfMakeModule.default.createPdf(documentDefinition);
    } else if (pdfMakeModule.pdfMake && pdfMakeModule.pdfMake.createPdf) {
      pdfDocGenerator = pdfMakeModule.pdfMake.createPdf(documentDefinition);
    } else {
      console.error('pdfMake object:', pdfMakeModule);
      throw new Error('No se pudo inicializar pdfMake.createPdf');
    }

    try {
      const data = await pdfDocGenerator.getBase64();
      if (this.platform.is('capacitor')) {
        const fileName = `reporte_financiero_${mesLabel.replace(' ', '_')}_${new Date().getTime()}.pdf`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: 'Reporte Mensual',
          text: `Adjunto mi reporte mensual de ${mesLabel}`,
          url: result.uri,
          dialogTitle: 'Compartir PDF',
        });
      } else {
        // Web fallback: download the PDF directly
        pdfDocGenerator.download(`reporte_financiero_${mesLabel.replace(' ', '_')}.pdf`);
      }
    } catch (error) {
      console.error('Error sharing or saving the PDF', error);
      throw error;
    }
  }

  private buildDocumentDefinition(
    mesLabel: string,
    totalAcumulado: number,
    categorias: CategoriaResumen[],
    gastos: Gasto[]
  ): any {
    return {
      content: [
        {
          text: 'Reporte Financiero Mensual',
          style: 'header',
          alignment: 'center'
        },
        {
          text: `Periodo: ${mesLabel}`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },

        // Resumen General Box
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: 'RESUMEN GENERAL',
                  style: 'sectionHeader',
                  fillColor: '#f3f4f6'
                }
              ],
              [
                {
                  text: [
                    'Total Gastado: ',
                    { text: this.currencyPipe.transform(totalAcumulado, '$', 'symbol', '1.2-2'), bold: true, color: '#ef4444' }
                  ],
                  margin: [0, 5, 0, 5]
                }
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },

        // Desglose por Categoría
        {
          text: 'Desglose por Categoría',
          style: 'sectionTitle',
          margin: [0, 10, 0, 10]
        },
        this.buildCategoriasTable(categorias),

        // Transacciones (Detalle)
        {
          text: 'Historial de Transacciones',
          style: 'sectionTitle',
          margin: [0, 20, 0, 10]
        },
        this.buildGastosTable(gastos)
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          color: '#1f2937'
        },
        subheader: {
          fontSize: 14,
          color: '#4b5563'
        },
        sectionHeader: {
          bold: true,
          fontSize: 13,
          color: '#374151',
          margin: [0, 5, 0, 5]
        },
        sectionTitle: {
          fontSize: 16,
          bold: true,
          color: '#111827'
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'white',
          fillColor: '#3b82f6',
          alignment: 'center'
        }
      },
      defaultStyle: {
        fontSize: 10,
        color: '#374151'
      }
    };
  }

  private buildCategoriasTable(categorias: CategoriaResumen[]) {
    if (categorias.length === 0) {
      return { text: 'No hubo gastos en este periodo.', italics: true };
    }

    const body = [
      [
        { text: 'Categoría', style: 'tableHeader' },
        { text: 'Porcentaje', style: 'tableHeader' },
        { text: 'Total', style: 'tableHeader' }
      ]
    ];

    categorias.forEach((cat, index) => {
      body.push([
        { text: cat.nombre, style: '', fillColor: index % 2 === 0 ? '#f9fafb' : '#ffffff' } as any,
        { text: `${(cat.porcentaje * 100).toFixed(1)}%`, style: '', alignment: 'center', fillColor: index % 2 === 0 ? '#f9fafb' : '#ffffff' } as any,
        { text: this.currencyPipe.transform(cat.total, '$', 'symbol', '1.2-2') || '', style: '', alignment: 'right', fillColor: index % 2 === 0 ? '#f9fafb' : '#ffffff' } as any
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto'],
        body: body
      },
      layout: 'lightHorizontalLines'
    };
  }

  private buildGastosTable(gastos: Gasto[]) {
    if (gastos.length === 0) {
      return { text: 'No hay transacciones para mostrar.', italics: true };
    }

    // Sort by date descending
    const sortedGastos = [...gastos].sort((a, b) => new Date(b.fecha_gasto).getTime() - new Date(a.fecha_gasto).getTime());

    const body = [
      [
        { text: 'Fecha', style: 'tableHeader' },
        { text: 'Descripción', style: 'tableHeader' },
        { text: 'Monto', style: 'tableHeader' }
      ]
    ];

    sortedGastos.forEach((gasto, index) => {
      const formattedDate = this.datePipe.transform(gasto.fecha_gasto, 'mediumDate') || '';
      body.push([
        { text: formattedDate, style: '', fillColor: index % 2 === 0 ? '#f9fafb' : '#ffffff' } as any,
        { text: gasto.concepto || 'Sin descripción', style: '', fillColor: index % 2 === 0 ? '#f9fafb' : '#ffffff' } as any,
        { text: this.currencyPipe.transform(gasto.monto, '$', 'symbol', '1.2-2') || '', style: '', alignment: 'right', fillColor: index % 2 === 0 ? '#f9fafb' : '#ffffff' } as any
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto'],
        body: body
      },
      layout: 'lightHorizontalLines'
    };
  }
}
