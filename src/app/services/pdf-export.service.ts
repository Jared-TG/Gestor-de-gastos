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

      background: function (currentPage: number) {
        return {
          canvas: [
            // Background banner
            { type: 'rect', x: 0, y: 0, w: 595.28, h: 100, color: '#2563eb' },
            // Orange bottom line
            { type: 'rect', x: 0, y: 100, w: 595.28, h: 3, color: '#f59e0b' },
            // Footer top line
            { type: 'rect', x: 40, y: 841.89 - 50, w: 595.28 - 80, h: 1, color: '#1e3a8a' }
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
          margin: [40, 10, 40, 0],
          columns: [
            {
              width: 'auto',
              columns: [
                {
                  image: LOGO_BASE64, width: 14, height: 14, margin: [0, 0, 0, 0]
                },
                { 
                  text: 'Gasto Fácil', fontSize: 9, color: '#1d4ed8', bold: true, margin: [6, 2, 0, 0] 
                }
              ]
            },
            {
              text: `Documento generado automáticamente - ${fechaGeneracion}`,
              fontSize: 7,
              color: '#9ca3af',
              alignment: 'center',
              margin: [0, 3, 0, 0],
              width: '*'
            },
            {
              text: `Página ${currentPage} de ${pageCount}`,
              fontSize: 7,
              color: '#9ca3af',
              alignment: 'right',
              margin: [0, 3, 0, 0],
              width: 'auto'
            }
          ]
        };
      },

      content: [
        // User Card
        {
          margin: [0, 0, 0, 20],
          table: {
            widths: ['*'],
            body: [
              [
                {
                  fillColor: '#f8fafc',
                  border: [false, false, false, false],
                  margin: [20, 15, 20, 15],
                  columns: [
                    {
                      width: 'auto',
                      canvas: [
                        { type: 'ellipse', x: 20, y: 20, r1: 20, r2: 20, color: '#2563eb' }
                      ]
                    },
                    {
                      width: 'auto',
                      // Absolutely position initials over canvas
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
                        { text: `${userName} • ${mesLabel}`, color: '#1e3a8a', fontSize: 12, bold: true }
                      ]
                    },
                    {
                      width: 'auto',
                      margin: [0, 2, 0, 0],
                      stack: [
                        { text: 'Total del periodo', color: '#6b7280', fontSize: 9, alignment: 'right' },
                        { text: this.currencyPipe.transform(totalAcumulado, '$', 'symbol', '1.2-2') || '$0.00', color: '#1d4ed8', fontSize: 22, bold: true, alignment: 'right' }
                      ]
                    }
                  ]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#e2e8f0',
            vLineColor: () => '#e2e8f0',
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0
          }
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
      table: {
        widths: ['*'],
        body: [
          [
            {
              border: [false, false, false, false],
              fillColor: '#ffffff',
              margin: [10, 10, 10, 10],
              stack: [
                { text: title, fontSize: 8, color: '#9ca3af', bold: true, characterSpacing: 1 },
                { text: value, fontSize: 18, color: valueColor, bold: true, margin: [0, 5, 0, 0] }
              ]
            }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#e2e8f0',
        vLineColor: () => '#e2e8f0'
      }
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
          border: [false, false, false, true],
          margin: [5, 10, 5, 10],
          stack: [
            { text: cat.nombre, fontSize: 10, color: '#1f2937' },
            {
              margin: [0, 8, 0, 0],
              canvas: [
                { type: 'rect', x: 0, y: 0, w: 150, h: 4, color: '#e5e7eb', r: 2 },
                { type: 'rect', x: 0, y: 0, w: 150 * percentage, h: 4, color: '#2563eb', r: 2 }
              ]
            }
          ]
        },
        {
          border: [false, false, false, true],
          margin: [5, 20, 5, 10],
          text: `${(percentage * 100).toFixed(1)}%`,
          color: '#2563eb',
          bold: true,
          alignment: 'right'
        },
        {
          border: [false, false, false, true],
          margin: [5, 20, 5, 10],
          text: this.currencyPipe.transform(cat.total, '$', 'symbol', '1.2-2') || '',
          color: '#111827',
          bold: true,
          alignment: 'right'
        }
      ]);
    });

    // Total Row
    body.push([
      { text: 'TOTAL', border: [false, false, false, false], margin: [5, 10, 5, 10], bold: true, color: '#1e3a8a' },
      { text: '100%', border: [false, false, false, false], margin: [5, 10, 5, 10], bold: true, alignment: 'right', color: '#1e3a8a' },
      { text: this.currencyPipe.transform(totalAcumulado, '$', 'symbol', '1.2-2') || '', border: [false, false, false, false], margin: [5, 10, 5, 10], bold: true, alignment: 'right', color: '#1e3a8a' }
    ]);

    return {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto'],
        body: body
      },
      layout: {
        hLineWidth: (i: number, node: any) => i === 0 || i === 1 || i === node.table.body.length - 1 || i === node.table.body.length ? 0 : 1,
        vLineWidth: () => 0,
        hLineColor: () => '#e2e8f0',
        paddingLeft: () => 10,
        paddingRight: () => 10,
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0) return '#2563eb';
          if (rowIndex === body.length - 1) return '#f8fafc';
          return null;
        }
      },
      margin: [0, 0, 0, 20],
      styles: {
        th: { color: 'white', bold: true, fontSize: 9 }
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
        { text: formattedDate, border: [false, false, false, true], margin: [5, 10, 5, 10], color: '#6b7280' },
        { text: gasto.concepto || 'Sin descripción', border: [false, false, false, true], margin: [5, 10, 5, 10], color: '#1f2937' },
        { 
          border: [false, false, false, true],
          margin: [5, 10, 5, 10],
          alignment: 'center',
          // Simulate a badge using a small table
          table: {
            widths: ['auto'],
            body: [[{ text: catNombre, fontSize: 8, color: '#2563eb', fillColor: '#eff6ff', border: [false, false, false, false], margin: [6, 3, 6, 3] }]]
          },
          layout: { defaultBorder: false }
        },
        { text: `-${this.currencyPipe.transform(gasto.monto, '$', 'symbol', '1.2-2')}`, border: [false, false, false, true], margin: [5, 10, 5, 10], color: '#dc2626', bold: true, alignment: 'right' }
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', 'auto'],
        body: body
      },
      layout: {
        hLineWidth: (i: number, node: any) => i === 0 || i === 1 || i === node.table.body.length ? 0 : 1,
        vLineWidth: () => 0,
        hLineColor: () => '#e2e8f0',
        paddingLeft: () => 10,
        paddingRight: () => 10,
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0) return '#2563eb';
          return null;
        }
      },
      styles: {
        th: { color: 'white', bold: true, fontSize: 9 }
      }
    };
  }
}
