import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Platform } from '@ionic/angular/standalone';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Gasto } from './supabase.service';
import { CategoriaResumen } from '../pages/resumen/resumen.component';
import { CurrencyPipe, DatePipe } from '@angular/common';

const pdfMakeX = pdfMake as any;
pdfMakeX.vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAd1JREFUeAHtmNFRwzAMhhWuA5QJmg0oE9ANYIMeEzBCYYKOQDfoMUGyAWGChAmSDYR8cY/WlVTbcQoP+e50ubMU549jyXYAJiYmVDJIACLe0WV51NSRNVmWfcFfQaIeyAqyFmWMb0+2hmthhdUYTj2qUOp8TrbF4byTLSAlVtwnpqP2FXkxSYw4uhRwmgQuJVlFdkgK8/CVNYnG+CmRvmEIKH9WkwAb+wLSvbmNkRKpgCFQB2vfT2RjW+srHKtR5gViETo+E6fE+rDXNNwo4kxJyBmXNG+4WB8azTlTfE9M22vApC6BF7OzltuYN4gB+Ym9UOJPgETMhIeZkuJmZxlSEtB/1eio3w8IEQh9HXMpIYydbyC9TEOXexLauT4pSW6ZtgbGIyd75Bw38M8JEbiEcem4RmkOVkxbqMBnxbeB87oZtiYLZUZbd73KDPbrs0srxWufmBvF+HXzF678lBAK9jvnszeVirXPCAqjhxi708awzYIq0Ipj+4NYhFFkRWoCFXHxo3fUuXYO2RyEcgKxPyqYGGnDuoWhoN95pHBEtLZNw/Q5hxRg+kNTOnGOyBTHzm1ycY7QNcYf3FdwLaxQ81vj0q+PYoiwVD+PzDqdw+kmt6L9XQUTExPj8gPhujJEAaixZwAAAABJRU5ErkJggg==';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  private currencyPipe = new CurrencyPipe('en-US');
  private datePipe = new DatePipe('en-US');

  constructor(private platform: Platform) {}

  private buildGradientRects(x: number, y: number, w: number, h: number, colorStart: string, colorEnd: string, steps: number = 60) {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
    };

    const rgbToHex = (r: number, g: number, b: number) => {
      return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
    };

    const start = hexToRgb(colorStart);
    const end = hexToRgb(colorEnd);
    const stepWidth = w / steps;
    const rects: any[] = [];

    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const r = Math.round(start.r + (end.r - start.r) * ratio);
      const g = Math.round(start.g + (end.g - start.g) * ratio);
      const b = Math.round(start.b + (end.b - start.b) * ratio);
      rects.push({
        type: 'rect',
        x: x + (i * stepWidth),
        y: y,
        w: stepWidth + 0.5,
        h: h,
        color: rgbToHex(r, g, b),
        lineColor: rgbToHex(r, g, b)
      });
    }
    return rects;
  }

  async generarReporte(
    mesLabel: string,
    totalAcumulado: number,
    categorias: CategoriaResumen[],
    gastos: Gasto[],
    userName: string
  ): Promise<void> {
    const documentDefinition = this.buildDocumentDefinition(
      mesLabel,
      totalAcumulado,
      categorias,
      gastos,
      userName
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
        const fileName = `reporte_${mesLabel.replace(' ', '_')}_${new Date().getTime()}.pdf`;
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
        // Web fallback
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
    gastos: Gasto[],
    userName: string
  ): any {
    const fechaGeneracion = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const userInitials = userName.substring(0, 2).toUpperCase();

    return {
      pageSize: 'A4',
      pageMargins: [40, 120, 40, 60], // Left, Top, Right, Bottom

      background: (currentPage: number) => {
        return {
          canvas: [
            // Background banner gradient
            ...this.buildGradientRects(0, 0, 595.28, 100, '#1e3a8a', '#2563eb', 80),
            // Bottom orange line
            { type: 'rect', x: 40, y: 841.89 - 65, w: 515.28, h: 2, color: '#f59e0b' }
          ]
        };
      },

      header: {
        columns: [
          // Left side: Logo and App Name
          {
            width: 'auto',
            margin: [40, 30, 0, 0],
            columns: [
              {
                image: LOGO_BASE64,
                width: 35,
                height: 35
              },
              {
                margin: [10, 0, 0, 0],
                stack: [
                  { text: 'Gasto Fácil', color: 'white', fontSize: 16, bold: true },
                  { text: 'Control inteligente de tus finanzas', color: '#bfdbfe', fontSize: 9 }
                ]
              }
            ]
          },
          // Right side: Report Info
          {
            width: '*',
            margin: [0, 25, 40, 0],
            stack: [
              { text: 'REPORTE FINANCIERO', color: '#bfdbfe', fontSize: 8, bold: true, alignment: 'right', characterSpacing: 1 },
              { text: mesLabel.toUpperCase(), color: 'white', fontSize: 18, bold: true, alignment: 'right', margin: [0, 2, 0, 2] },
              { text: `Generado el ${fechaGeneracion}`, color: '#bfdbfe', fontSize: 7, alignment: 'right' }
            ]
          }
        ]
      },

      footer: function (currentPage: number, pageCount: number) {
        return {
          margin: [40, 20, 40, 0],
          columns: [
            {
              width: 'auto',
              columns: [
                {
                  image: LOGO_BASE64, width: 20, height: 20, margin: [0, 0, 0, 0]
                },
                { 
                  text: 'Gasto Fácil', fontSize: 10, color: '#1e3a8a', bold: true, margin: [8, 3, 0, 0] 
                }
              ]
            },
            {
              text: `Documento generado automáticamente - ${fechaGeneracion}`,
              fontSize: 8,
              color: '#9ca3af',
              alignment: 'center',
              margin: [0, 5, 0, 0],
              width: '*'
            },
            {
              text: `Página ${currentPage} de ${pageCount}`,
              fontSize: 8,
              color: '#9ca3af',
              alignment: 'right',
              margin: [0, 5, 0, 0],
              width: 'auto'
            }
          ]
        };
      },

      content: [
        // User Card
        {
          margin: [0, 0, 0, 20],
          stack: [
            {
              canvas: [
                { type: 'rect', x: 0, y: 0, w: 515.28, h: 70, r: 12, color: '#f8fafc' }
              ]
            },
            {
              margin: [20, -55, 20, 0],
              columns: [
                {
                  width: 'auto',
                  canvas: [
                    { type: 'ellipse', x: 20, y: 20, r1: 20, r2: 20, color: '#2563eb' }
                  ]
                },
                {
                  width: 'auto',
                  text: userInitials,
                  color: 'white',
                  bold: true,
                  fontSize: 14,
                  margin: [-29, 13, 0, 0]
                },
                {
                  width: '*',
                  margin: [15, 6, 0, 0],
                  stack: [
                    { text: 'Reporte correspondiente a', color: '#6b7280', fontSize: 9 },
                    { text: `${userName} - ${mesLabel}`, color: '#1e3a8a', fontSize: 12, bold: true }
                  ]
                },
                {
                  width: 'auto',
                  margin: [0, 2, 0, 0],
                  stack: [
                    { text: 'Total del periodo', color: '#6b7280', fontSize: 9, alignment: 'right' },
                    { text: this.currencyPipe.transform(totalAcumulado, '$', 'symbol', '1.2-2') || '$0.00', color: '#1e3a8a', fontSize: 22, bold: true, alignment: 'right' }
                  ]
                }
              ]
            }
          ]
        },

        // Resumen General Header
        this.buildSectionTitle('Resumen General'),
        
        // Cards Resumen
        {
          columns: [
            this.buildStatCard('TOTAL GASTADO', this.currencyPipe.transform(totalAcumulado, '$', 'symbol', '1.2-2') || '$0.00', '#2563eb'),
            { width: 10, text: '' }, // spacer
            this.buildStatCard('CATEGORÍAS', categorias.length.toString(), '#9333ea'),
            { width: 10, text: '' }, // spacer
            this.buildStatCard('TRANSACCIONES', gastos.length.toString(), '#ea580c')
          ],
          margin: [0, 0, 0, 25]
        },

        // Categorías Header
        this.buildSectionTitle('Desglose por Categoría'),
        
        // Categorías Table
        this.buildCategoriasTable(categorias, totalAcumulado),

        // Transacciones Header
        { text: '', margin: [0, 15, 0, 0] },
        this.buildSectionTitle('Historial de Transacciones'),

        // Transacciones Table
        this.buildGastosTable(gastos, categorias)
      ],
      defaultStyle: {
        fontSize: 10,
        color: '#1f2937'
      },
      styles: {
        th: { color: 'white', bold: true, fontSize: 9 }
      }
    };
  }

  private buildSectionTitle(title: string) {
    return {
      margin: [0, 0, 0, 15],
      columns: [
        {
          width: 4,
          canvas: [{ type: 'rect', x: 0, y: 0, w: 4, h: 14, color: '#2563eb' }]
        },
        {
          text: title,
          fontSize: 12,
          bold: true,
          color: '#1e3a8a',
          margin: [6, 0, 0, 0]
        }
      ]
    };
  }

  private buildStatCard(title: string, value: string, valueColor: string) {
    return {
      width: '*',
      stack: [
        {
          canvas: [
            { type: 'rect', x: 0, y: 0, w: 165, h: 60, r: 8, color: '#ffffff', lineColor: '#e2e8f0', lineWidth: 1 }
          ]
        },
        {
          margin: [15, -45, 0, 0],
          stack: [
            { text: title, fontSize: 8, color: '#9ca3af', bold: true, characterSpacing: 1 },
            { text: value, fontSize: 18, color: valueColor, bold: true, margin: [0, 5, 0, 0] }
          ]
        }
      ]
    };
  }

  private buildCategoriasTable(categorias: CategoriaResumen[], totalAcumulado: number) {
    if (categorias.length === 0) {
      return { text: 'No hubo gastos en este periodo.', italics: true, color: '#6b7280', margin: [0, 0, 0, 20] };
    }

    const body: any[] = [
      [
        { text: 'CATEGORÍA', style: 'th', alignment: 'left' },
        { text: 'PORCENTAJE', style: 'th', alignment: 'right' },
        { text: 'TOTAL', style: 'th', alignment: 'right' }
      ]
    ];

    categorias.forEach((cat) => {
      const percentage = cat.porcentaje;
      body.push([
        {
          stack: [
            { text: cat.nombre, fontSize: 10, color: '#1f2937' },
            {
              margin: [0, 8, 0, 0],
              canvas: [
                { type: 'rect', x: 0, y: 0, w: 150, h: 4, color: '#e5e7eb' },
                ...this.buildGradientRects(0, 0, 150 * percentage, 4, '#1e3a8a', '#2563eb', Math.max(5, Math.floor(50 * percentage)))
              ]
            }
          ]
        },
        {
          margin: [0, 10, 0, 0],
          text: `${(percentage * 100).toFixed(1)}%`,
          color: '#2563eb',
          bold: true,
          alignment: 'right'
        },
        {
          margin: [0, 10, 0, 0],
          text: this.currencyPipe.transform(cat.total, '$', 'symbol', '1.2-2') || '',
          color: '#111827',
          bold: true,
          alignment: 'right'
        }
      ]);
    });

    body.push([
      { text: 'TOTAL', bold: true, color: '#1e3a8a' },
      { text: '100%', bold: true, alignment: 'right', color: '#1e3a8a' },
      { text: this.currencyPipe.transform(totalAcumulado, '$', 'symbol', '1.2-2') || '', bold: true, alignment: 'right', color: '#1e3a8a' }
    ]);

    return {
      margin: [0, 0, 0, 20],
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto'],
        body: body
      },
      layout: {
        hLineWidth: (i: number, node: any) => {
          if (i === 0 || i === node.table.body.length) return 1;
          if (i === 1) return 0; // under header
          return 1;
        },
        vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 1 : 0),
        hLineColor: () => '#e2e8f0',
        vLineColor: () => '#e2e8f0',
        paddingLeft: () => 15,
        paddingRight: () => 15,
        paddingTop: (i: number) => i === 0 ? 11 : 10,
        paddingBottom: (i: number) => i === 0 ? 11 : 10,
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0) return '#1d4ed8';
          if (rowIndex === body.length - 1) return '#f8fafc';
          return '#ffffff';
        }
      }
    };
  }

  private buildGastosTable(gastos: Gasto[], categorias: CategoriaResumen[]) {
    if (gastos.length === 0) {
      return { text: 'No hay transacciones para mostrar.', italics: true, color: '#6b7280' };
    }

    const sortedGastos = [...gastos].sort((a, b) => new Date(b.fecha_gasto).getTime() - new Date(a.fecha_gasto).getTime());

    const body: any[] = [
      [
        { text: 'FECHA', style: 'th', alignment: 'left' },
        { text: 'DESCRIPCIÓN', style: 'th', alignment: 'left' },
        { text: 'CATEGORÍA', style: 'th', alignment: 'center' },
        { text: 'MONTO', style: 'th', alignment: 'right' }
      ]
    ];

    sortedGastos.forEach((gasto) => {
      const formattedDate = this.datePipe.transform(gasto.fecha_gasto, 'MMM d, y') || '';
      const categoria = categorias.find(c => c.id === gasto.categoria_id);
      const catNombre = categoria ? categoria.nombre : 'Otra';

      body.push([
        { text: formattedDate, color: '#6b7280' },
        { text: gasto.concepto || 'Sin descripción', color: '#1f2937' },
        { 
          alignment: 'center',
          table: {
            widths: ['auto'],
            body: [[{ text: catNombre, fontSize: 8, color: '#2563eb', fillColor: '#eff6ff', border: [false, false, false, false], margin: [6, 3, 6, 3] }]]
          },
          layout: { defaultBorder: false },
          margin: [0, -3, 0, 0]
        },
        { text: `-${this.currencyPipe.transform(gasto.monto, '$', 'symbol', '1.2-2')}`, color: '#dc2626', bold: true, alignment: 'right' }
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', 'auto'],
        body: body
      },
      layout: {
        hLineWidth: (i: number, node: any) => {
          if (i === 0 || i === node.table.body.length) return 1;
          if (i === 1) return 0; // under header
          return 1;
        },
        vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 1 : 0),
        hLineColor: () => '#e2e8f0',
        vLineColor: () => '#e2e8f0',
        paddingLeft: () => 15,
        paddingRight: () => 15,
        paddingTop: (i: number) => i === 0 ? 12 : 12,
        paddingBottom: (i: number) => i === 0 ? 12 : 12,
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0) return '#1d4ed8';
          return '#ffffff';
        }
      }
    };
  }
}
