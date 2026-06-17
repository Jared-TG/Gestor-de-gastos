import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Señales para acceder reactivamente al estado del usuario
  usuario = signal<User | null>(null);
  esAnonimo = signal<boolean>(true);

  /** Nombre del usuario registrado, o 'Gasto Fácil' si es anónimo */
  nombreUsuario = computed(() => {
    const user = this.usuario();
    if (!user || user.is_anonymous) return 'Gasto Fácil';
    return user.user_metadata?.['nombre'] || user.email || 'Gasto Fácil';
  });

  /** Email del usuario registrado */
  emailUsuario = computed(() => {
    const user = this.usuario();
    return user?.email || '';
  });

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
   * Registra un nuevo usuario convirtiendo la cuenta anónima actual
   * en una cuenta permanente. Esto hereda todos los datos (gastos)
   * asociados al usuario anónimo.
   */
  async registrar(nombre: string, email: string, password: string) {
    // updateUser convierte la sesión anónima en permanente,
    // preservando el mismo user_id y sus datos asociados.
    const { data, error } = await this.supabaseService.client.auth.updateUser({
      email,
      password,
      data: { nombre }
    });

    if (error) throw error;
    if (data.user) this.actualizarEstado(data.user);
    return data;
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async iniciarSesion(email: string, password: string) {
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (data.user) this.actualizarEstado(data.user);
    return data;
  }

  /**
   * Cierra la sesión actual y crea una nueva sesión anónima
   */
  async cerrarSesion() {
    const { error } = await this.supabaseService.client.auth.signOut();
    if (error) throw error;

    // Crear nueva sesión anónima para que la app siga funcionando
    const { data, error: signInError } = await this.supabaseService.client.auth.signInAnonymously();
    if (signInError) throw signInError;
    if (data.user) this.actualizarEstado(data.user);
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
