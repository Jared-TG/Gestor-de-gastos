import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: any = null;

  /** true si el evento beforeinstallprompt fue capturado (Android/Desktop) */
  canInstall = signal(false);

  /** true si es iOS y la app aún no está instalada */
  isIos = signal(false);

  /** true si la app ya está corriendo como PWA instalada */
  isInstalled = signal(false);

  /** true si debe mostrarse alguna UI de instalación */
  showInstallUI = signal(false);

  constructor() {
    this.detectPlatform();
    this.listenForInstallPrompt();
  }

  private detectPlatform() {
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isInStandaloneMode) {
      this.isInstalled.set(true);
      this.showInstallUI.set(false);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    if (isIos) {
      this.isIos.set(true);
      this.showInstallUI.set(true);
    }
  }

  private listenForInstallPrompt() {
    // Captura el evento antes de que el componente esté listo
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.set(true);
      this.showInstallUI.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.isInstalled.set(true);
      this.showInstallUI.set(false);
    });
  }

  /** Dispara el prompt nativo de instalación en Android */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) return false;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.canInstall.set(false);
    if (outcome === 'accepted') {
      this.isInstalled.set(true);
      this.showInstallUI.set(false);
    }
    return outcome === 'accepted';
  }
}
