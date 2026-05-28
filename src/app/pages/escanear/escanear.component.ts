import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonBadge,
  IonNote
} from '@ionic/angular/standalone';
import { CameraPreview, CameraPreviewOptions } from '@capacitor-community/camera-preview';
import { addIcons } from 'ionicons';
import { camera, image, trash, sparkles } from 'ionicons/icons';

@Component({
  selector: 'app-escanear',
  templateUrl: './escanear.component.html',
  styleUrls: ['./escanear.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonBadge,
    IonNote
],
})
export class EscanearComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scannerZone', { read: ElementRef }) scannerZone!: ElementRef;
  private isCameraActive = false;

  constructor(private renderer: Renderer2) {
    // Register specific vector icon glyphs for tree-shaking performance
    addIcons({ camera, image, trash, sparkles });
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
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      toBack: false,
      enableZoom: false,
      disableExifHeaderStripping: true
    };

    try {
      await CameraPreview.start(options);
      this.isCameraActive = true;
    } catch (err) {
      console.error('Failed to link camera device core:', err);
    }
  }

  async ngOnDestroy() {
    if (this.isCameraActive) {
      await CameraPreview.stop();
    }
  }
}