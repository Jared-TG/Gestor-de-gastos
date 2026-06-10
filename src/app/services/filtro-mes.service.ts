import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FiltroMesService {
  /** Mes seleccionado (0-11) y año */
  private _mes = signal(new Date().getMonth());
  private _anio = signal(new Date().getFullYear());

  /** Señales públicas de solo lectura */
  readonly mes = this._mes.asReadonly();
  readonly anio = this._anio.asReadonly();

  /** Primer día del mes seleccionado (YYYY-MM-DD) */
  readonly primerDia = computed(() => {
    const d = new Date(this._anio(), this._mes(), 1);
    return d.toISOString().split('T')[0];
  });

  /** Último día del mes seleccionado (YYYY-MM-DD) */
  readonly ultimoDia = computed(() => {
    const d = new Date(this._anio(), this._mes() + 1, 0);
    return d.toISOString().split('T')[0];
  });

  /** Nombre del mes en español, capitalizado */
  readonly nombreMes = computed(() => {
    const d = new Date(this._anio(), this._mes(), 1);
    const nombre = d.toLocaleDateString('es-MX', { month: 'long' });
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  });

  /** Etiqueta completa: "Junio 2026" */
  readonly etiquetaMes = computed(() =>
    `${this.nombreMes()} ${this._anio()}`
  );

  /** ¿Es el mes actual? (para desactivar el botón de avance) */
  readonly esMesActual = computed(() => {
    const ahora = new Date();
    return this._mes() === ahora.getMonth() && this._anio() === ahora.getFullYear();
  });

  /** Navegar al mes anterior */
  mesAnterior(): void {
    if (this._mes() === 0) {
      this._mes.set(11);
      this._anio.set(this._anio() - 1);
    } else {
      this._mes.set(this._mes() - 1);
    }
  }

  /** Navegar al mes siguiente (no permitir futuro) */
  mesSiguiente(): void {
    if (this.esMesActual()) return;
    if (this._mes() === 11) {
      this._mes.set(0);
      this._anio.set(this._anio() + 1);
    } else {
      this._mes.set(this._mes() + 1);
    }
  }
}
