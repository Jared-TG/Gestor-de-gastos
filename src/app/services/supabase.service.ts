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
}
