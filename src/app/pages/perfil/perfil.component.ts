import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonIcon, IonButton, IonButtons, IonInput, IonItem,
  IonList, IonLabel, IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircle, mailOutline, lockClosedOutline,
  personOutline, eyeOutline, eyeOffOutline,
  logOutOutline, chevronForwardOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonIcon, IonButton, IonButtons, IonInput, IonItem,
    IonList, IonLabel, IonText, IonSpinner,
  ],
})
export class PerfilComponent {
  // Toggle entre 'login' y 'registro'
  vistaActiva = signal<'login' | 'registro'>('login');

  // Campos del formulario
  nombre = '';
  email = '';
  password = '';
  confirmarPassword = '';

  // Estados UI
  mostrarPassword = signal(false);
  mostrarConfirmPassword = signal(false);
  cargando = signal(false);
  errorMsg = signal('');
  exitoMsg = signal('');

  constructor(public auth: AuthService) {
    addIcons({
      personCircle, mailOutline, lockClosedOutline,
      personOutline, eyeOutline, eyeOffOutline,
      logOutOutline, chevronForwardOutline
    });
  }

  cambiarVista(vista: 'login' | 'registro') {
    this.vistaActiva.set(vista);
    this.limpiarFormulario();
  }

  togglePassword() {
    this.mostrarPassword.update(v => !v);
  }

  toggleConfirmPassword() {
    this.mostrarConfirmPassword.update(v => !v);
  }

  async iniciarSesion() {
    if (!this.email || !this.password) {
      this.errorMsg.set('Por favor completa todos los campos.');
      return;
    }

    this.cargando.set(true);
    this.errorMsg.set('');

    try {
      await this.auth.iniciarSesion(this.email, this.password);
      this.exitoMsg.set('¡Bienvenido de vuelta!');
      this.limpiarFormulario();
    } catch (error: any) {
      this.errorMsg.set(this.traducirError(error.message));
    } finally {
      this.cargando.set(false);
    }
  }

  async registrarse() {
    if (!this.nombre || !this.email || !this.password || !this.confirmarPassword) {
      this.errorMsg.set('Por favor completa todos los campos.');
      return;
    }

    if (this.password !== this.confirmarPassword) {
      this.errorMsg.set('Las contraseñas no coinciden.');
      return;
    }

    if (this.password.length < 6) {
      this.errorMsg.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.cargando.set(true);
    this.errorMsg.set('');

    try {
      await this.auth.registrar(this.nombre, this.email, this.password);
      this.exitoMsg.set('¡Cuenta creada exitosamente!');
      this.limpiarFormulario();
    } catch (error: any) {
      this.errorMsg.set(this.traducirError(error.message));
    } finally {
      this.cargando.set(false);
    }
  }

  async cerrarSesion() {
    this.cargando.set(true);
    try {
      await this.auth.cerrarSesion();
      this.exitoMsg.set('');
      this.vistaActiva.set('login');
    } catch (error: any) {
      this.errorMsg.set('Error al cerrar sesión.');
    } finally {
      this.cargando.set(false);
    }
  }

  private limpiarFormulario() {
    this.nombre = '';
    this.email = '';
    this.password = '';
    this.confirmarPassword = '';
    this.errorMsg.set('');
  }

  private traducirError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Credenciales incorrectas.';
    if (msg.includes('User already registered')) return 'Este correo ya está registrado.';
    if (msg.includes('Email not confirmed')) return 'Confirma tu correo electrónico primero.';
    if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
    return msg || 'Ocurrió un error. Intenta de nuevo.';
  }
}
