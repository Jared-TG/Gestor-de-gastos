import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, closeOutline, phonePortraitOutline, shareOutline } from 'ionicons/icons';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  template: `
    <!-- Banner Android / Desktop -->
    @if (pwaService.canInstall() && !dismissed) {
      <div class="pwa-banner pwa-banner--android">
        <div class="pwa-banner__content">
          <ion-icon name="download-outline" class="pwa-banner__icon"></ion-icon>
          <div class="pwa-banner__text">
            <strong>Instalar Practica4</strong>
            <span>Instala la app en tu dispositivo para usarla sin conexión</span>
          </div>
        </div>
        <div class="pwa-banner__actions">
          <ion-button fill="clear" size="small" color="medium" (click)="dismiss()">
            <ion-icon slot="icon-only" name="close-outline"></ion-icon>
          </ion-button>
          <ion-button fill="solid" size="small" color="primary" (click)="install()">
            Instalar
          </ion-button>
        </div>
      </div>
    }

    <!-- Banner iOS -->
    @if (pwaService.isIos() && !pwaService.isInstalled() && !dismissed) {
      <div class="pwa-banner pwa-banner--ios">
        <div class="pwa-banner__content">
          <ion-icon name="phone-portrait-outline" class="pwa-banner__icon"></ion-icon>
          <div class="pwa-banner__text">
            <strong>Instalar en iPhone / iPad</strong>
            <span>
              Toca <ion-icon name="share-outline" class="pwa-banner__inline-icon"></ion-icon> y luego
              <em>"Agregar a pantalla de inicio"</em>
            </span>
          </div>
        </div>
        <div class="pwa-banner__actions">
          <ion-button fill="clear" size="small" color="medium" (click)="dismiss()">
            <ion-icon slot="icon-only" name="close-outline"></ion-icon>
          </ion-button>
        </div>
      </div>
    }
  `,
  styles: [`
    .pwa-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      gap: 12px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    .pwa-banner--android {
      background: rgba(var(--ion-color-primary-rgb), 0.92);
      color: white;
    }

    .pwa-banner--ios {
      background: rgba(255, 255, 255, 0.92);
      color: var(--ion-color-dark);
      border-top: 1px solid rgba(0,0,0,0.1);
    }

    .pwa-banner__content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .pwa-banner__icon {
      font-size: 28px;
      flex-shrink: 0;
    }

    .pwa-banner__text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 13px;
      line-height: 1.4;
    }

    .pwa-banner__text strong {
      font-size: 14px;
      font-weight: 700;
    }

    .pwa-banner__inline-icon {
      font-size: 14px;
      vertical-align: middle;
      margin: 0 2px;
    }

    .pwa-banner__actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class PwaInstallBannerComponent {
  pwaService = inject(PwaInstallService);
  dismissed = false;

  constructor() {
    addIcons({ downloadOutline, closeOutline, phonePortraitOutline, shareOutline });
  }

  async install() {
    await this.pwaService.promptInstall();
  }

  dismiss() {
    this.dismissed = true;
  }
}
