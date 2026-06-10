import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Gasto {
  id?: number;
  concepto: string;
  establecimiento?: string;
  monto: number;
  fecha_gasto: string;
  categoria_id: number;
  metodo_pago_id: number;
  notas?: string;
  imagen_ticket_url?: string;
  procesado_por_ia?: boolean;
  fecha_creacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseurl, environment.supabasekey);
  }

  async insertarGasto(gasto: Gasto) {
    const { data, error } = await this.supabase
      .from('gastos')
      .insert([gasto])
      .select();

    if (error) {
      console.error('Error insertando gasto:', error);
      throw error;
    }
    return data;
  }

  async obtenerGastosRecientes(): Promise<Gasto[]> {
    const { data, error } = await this.supabase
      .from('gastos')
      .select('*')
      .order('fecha_creacion', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error obteniendo gastos:', error);
      throw error;
    }
    return data ?? [];
  }

  /** Obtiene todos los gastos del mes actual para calcular estadísticas */
  async obtenerGastosDelMes(): Promise<Gasto[]> {
    const now = new Date();
    const primerDia = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('gastos')
      .select('*')
      .gte('fecha_gasto', primerDia)
      .lte('fecha_gasto', ultimoDia)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      console.error('Error obteniendo gastos del mes:', error);
      throw error;
    }
    return data ?? [];
  }

  /** Obtiene todos los gastos ordenados por fecha */
  async obtenerTodosLosGastos(): Promise<Gasto[]> {
    const { data, error } = await this.supabase
      .from('gastos')
      .select('*')
      .order('fecha_gasto', { ascending: false });

    if (error) {
      console.error('Error obteniendo todos los gastos:', error);
      throw error;
    }
    return data ?? [];
  }

  /** Obtiene todos los gastos de un mes/año específico */
  async obtenerGastosPorMes(mes: number, anio: number): Promise<Gasto[]> {
    const primerDia = new Date(anio, mes, 1).toISOString().split('T')[0];
    const ultimoDia = new Date(anio, mes + 1, 0).toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('gastos')
      .select('*')
      .gte('fecha_gasto', primerDia)
      .lte('fecha_gasto', ultimoDia)
      .order('fecha_gasto', { ascending: false });

    if (error) {
      console.error('Error obteniendo gastos por mes:', error);
      throw error;
    }
    return data ?? [];
  }

  /** Obtiene los últimos 5 gastos de un mes/año específico */
  async obtenerGastosRecientesPorMes(mes: number, anio: number): Promise<Gasto[]> {
    const primerDia = new Date(anio, mes, 1).toISOString().split('T')[0];
    const ultimoDia = new Date(anio, mes + 1, 0).toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('gastos')
      .select('*')
      .gte('fecha_gasto', primerDia)
      .lte('fecha_gasto', ultimoDia)
      .order('fecha_creacion', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error obteniendo gastos recientes por mes:', error);
      throw error;
    }
    return data ?? [];
  }

  /** Obtiene un gasto por su ID */
  async obtenerGastoPorId(id: number): Promise<Gasto | null> {
    const { data, error } = await this.supabase
      .from('gastos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error obteniendo gasto:', error);
      throw error;
    }
    return data;
  }

  /** Actualiza un gasto existente */
  async actualizarGasto(id: number, gasto: Partial<Gasto>) {
    const { data, error } = await this.supabase
      .from('gastos')
      .update(gasto)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error actualizando gasto:', error);
      throw error;
    }
    return data;
  }

  /** Elimina un gasto por su ID */
  async eliminarGasto(id: number) {
    const { error } = await this.supabase
      .from('gastos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando gasto:', error);
      throw error;
    }
  }
}
