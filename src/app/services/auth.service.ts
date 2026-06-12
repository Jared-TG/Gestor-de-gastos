import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Señales para acceder reactivamente al estado del usuario
  usuario = signal<User | null>(null);
  esAnonimo = signal<boolean>(true);

  constructor(private supabaseService: SupabaseService) {
    this.escucharCambiosSesion();
  }

  /**
   * Inicializa la sesión al arrancar la app.
   * Si no hay sesión activa, crea un usuario anónimo.
   */
  async inicializar() {
    try {
      const { data: { session }, error } = await this.supabaseService.client.auth.getSession();
      
      if (error) {
        console.error('Error obteniendo sesión:', error);
      }

      if (session) {
        this.actualizarEstado(session.user);
      } else {
        // No hay sesión → Crear cuenta anónima
        const { data, error: signInError } = await this.supabaseService.client.auth.signInAnonymously();
        if (signInError) throw signInError;
        if (data.user) this.actualizarEstado(data.user);
      }
    } catch (error) {
      console.error('Error en inicializar AuthService:', error);
    }
  }

  /**
   * Escucha cambios en la autenticación para actualizar las señales
   */
  private escucharCambiosSesion() {
    this.supabaseService.client.auth.onAuthStateChange((event, session) => {
      this.actualizarEstado(session?.user ?? null);
    });
  }

  private actualizarEstado(user: User | null) {
    this.usuario.set(user);
    this.esAnonimo.set(user?.is_anonymous ?? true);
  }
}
