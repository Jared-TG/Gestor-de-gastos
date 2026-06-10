import { Injectable, signal } from '@angular/core';
import { SupabaseService, Categoria } from './supabase.service';

/** Colores para asignar automáticamente a nuevas categorías */
const PALETTE = [
  '#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6',
  '#e67e22', '#1abc9c', '#e84393', '#00b894', '#6c5ce7',
  '#fd79a8', '#0984e3', '#fdcb6e', '#d63031', '#00cec9',
];

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  /** Lista de categorías cargadas desde Supabase */
  categorias = signal<Categoria[]>([]);

  /** Flag para evitar cargas duplicadas */
  private cargado = false;

  constructor(private supabase: SupabaseService) {}

  /** Carga las categorías desde Supabase (una sola vez o forzado) */
  async cargarCategorias(forzar = false): Promise<void> {
    if (this.cargado && !forzar) return;
    try {
      const cats = await this.supabase.obtenerCategorias();
      this.categorias.set(cats);
      this.cargado = true;
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  }

  /** Crea una nueva categoría con icono y color automáticos */
  async crearCategoria(nombre: string): Promise<Categoria | null> {
    try {
      const colorIndex = this.categorias().length % PALETTE.length;
      const nueva = await this.supabase.insertarCategoria({
        nombre,
        icono: 'pricetag-outline',
        color: PALETTE[colorIndex],
      });
      // Recargar la lista
      await this.cargarCategorias(true);
      return nueva;
    } catch (error) {
      console.error('Error creando categoría:', error);
      return null;
    }
  }

  /** Obtiene una categoría por su ID */
  obtenerPorId(id: number): Categoria | undefined {
    return this.categorias().find(c => c.id === id);
  }

  /** Obtiene el nombre de una categoría por su ID */
  getNombre(id: number): string {
    return this.obtenerPorId(id)?.nombre ?? 'Otros';
  }

  /** Obtiene el icono de una categoría por su ID */
  getIcono(id: number): string {
    return this.obtenerPorId(id)?.icono ?? 'pricetag-outline';
  }

  /** Obtiene el color de una categoría por su ID */
  getColor(id: number): string {
    return this.obtenerPorId(id)?.color ?? '#95a5a6';
  }
}
