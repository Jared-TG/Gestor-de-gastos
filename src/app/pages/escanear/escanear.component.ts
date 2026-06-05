import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';

import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonNote,
  IonCard, IonCardContent, IonButton, IonIcon,
  IonItem, IonLabel, IonThumbnail, IonBadge,
  IonSpinner,
} from '@ionic/angular/standalone';
import { CameraPreview, CameraPreviewOptions } from '@capacitor-community/camera-preview';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { camera, image, trash, sparkles, checkmarkCircle, alertCircle } from 'ionicons/icons';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-escanear',
  templateUrl: './escanear.component.html',
  styleUrls: ['./escanear.component.scss'],
  standalone: true,
  imports: [

    IonHeader, IonToolbar, IonContent,
    IonCard, IonCardContent, IonButton, IonIcon,
    IonItem, IonLabel, IonThumbnail, IonBadge,
    IonNote, IonSpinner,
  ],
})
export class EscanearComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scannerZone', { read: ElementRef }) scannerZone!: ElementRef;

  private isCameraActive = false;

  /** Base64 de la imagen capturada (sin prefijo data:image) */
  capturedImage: string | null = null;
  /** URI completo para mostrar en <img> */
  capturedImageSrc: string | null = null;

  isAnalyzing = false;
  errorMsg: string | null = null;
  successMsg: string | null = null;

  constructor(
    private gemini: GeminiService,
    private router: Router
  ) {
    addIcons({ camera, image, trash, sparkles, checkmarkCircle, alertCircle });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeScanner();
    }, 300);
  }

  async initializeScanner() {
    if (!this.scannerZone) return;

    const rect = this.scannerZone.nativeElement.getBoundingClientRect();

    const options: CameraPreviewOptions = {
      parent: 'scannerZone',
      position: 'rear',
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      toBack: false,
      enableZoom: false,
      disableExifHeaderStripping: true,
    };

    try {
      await CameraPreview.start(options);
      this.isCameraActive = true;
    } catch (err) {
      console.warn('CameraPreview no disponible (navegador de escritorio):', err);
      // En navegador de escritorio usamos @capacitor/camera como fallback
    }
  }

  /** Captura la foto desde la cámara activa o desde el navegador */
  async tomarFoto() {
    this.errorMsg = null;
    this.successMsg = null;

    try {
      if (this.isCameraActive) {
        // Dispositivo nativo con CameraPreview activo
        const result = await CameraPreview.capture({ quality: 90 });
        let base64 = result.value || '';
        
        // Limpiar prefijo data:image si viene incluido
        if (base64.startsWith('data:')) {
          this.capturedImageSrc = base64;
          this.capturedImage = base64.split(',')[1];
        } else {
          this.capturedImageSrc = `data:image/jpeg;base64,${base64}`;
          this.capturedImage = base64;
        }

        // Detener la cámara para que no se superponga sobre la imagen capturada
        await CameraPreview.stop();
        this.isCameraActive = false;
      } else {
        // Fallback navegador: usar @capacitor/camera (abre input file en web)
        const photo = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
        });
        
        let base64 = photo.base64String || '';
        this.capturedImage = base64;
        this.capturedImageSrc = base64 ? `data:image/jpeg;base64,${base64}` : null;
      }

      if (this.capturedImage) {
        this.successMsg = 'Foto capturada correctamente';
        // Ocultar mensaje de éxito después de 2 segundos
        setTimeout(() => { this.successMsg = null; }, 2000);
      }
    } catch (err: any) {
      console.error('Error al capturar foto:', err);
      this.errorMsg = 'No se pudo capturar la foto. Comprueba los permisos de cámara.';
    }
  }

  /** Selecciona una imagen desde la galería */
  async seleccionarDeGaleria() {
    this.errorMsg = null;
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      this.capturedImage = photo.base64String ?? null;
      this.capturedImageSrc = photo.base64String
        ? `data:image/jpeg;base64,${photo.base64String}`
        : null;
    } catch (err: any) {
      if (!err?.message?.includes('cancelled')) {
        this.errorMsg = 'No se pudo acceder a la galería.';
      }
    }
  }

  /** Descarta la imagen capturada y reactiva la cámara */
  async descartarFoto() {
    this.capturedImage = null;
    this.capturedImageSrc = null;
    this.errorMsg = null;
    this.successMsg = null;

    // Reiniciar la cámara si había sido detenida al capturar
    if (!this.isCameraActive) {
      setTimeout(() => this.initializeScanner(), 100);
    }
  }

  /** Envía la imagen a Gemini y navega al formulario con los datos extraídos */
  async analizarConIA() {
    if (!this.capturedImage) {
      this.errorMsg = 'Primero debes tomar una foto del ticket.';
      return;
    }

    this.isAnalyzing = true;
    this.errorMsg = null;

    try {
      const ticketData = await this.gemini.analizarTicket(this.capturedImage);

      // Si la fecha extraída es de un mes anterior, usar la fecha de hoy
      // para que el gasto se refleje en el dashboard del mes actual
      const hoy = new Date();
      const fechaTicket = new Date(ticketData.fecha + 'T00:00:00');
      const esDelMesActual =
        fechaTicket.getFullYear() === hoy.getFullYear() &&
        fechaTicket.getMonth() === hoy.getMonth();

      const fechaFinal = esDelMesActual
        ? ticketData.fecha
        : hoy.toISOString().split('T')[0];

      // Navegar a /nuevogasto pasando los datos como query params
      this.router.navigate(['/nuevogasto'], {
        queryParams: {
          concepto:   ticketData.concepto,
          monto:      ticketData.monto ?? '',
          fecha:      fechaFinal,
          categoria:  ticketData.categoria,
          metodoPago: ticketData.metodoPago,
          notas:      ticketData.notas,
          desde_ia:   'true',
        }
      });
    } catch (err: any) {
      console.error('Error analizando con IA:', err);
      this.errorMsg = 'Error al analizar el ticket con IA. Intenta de nuevo.';
    } finally {
      this.isAnalyzing = false;
    }
  }

  async ngOnDestroy() {
    if (this.isCameraActive) {
      try {
        await CameraPreview.stop();
      } catch { /* ignorar */ }
    }
  }
}