import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { CameraPreview, CameraPreviewOptions } from '@capacitor-community/camera-preview';

@Component({
  selector: 'app-escanear',
  templateUrl: './escanear.component.html',
  styleUrls: ['./escanear.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonContent],
})
export class EscanearComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scannerZone', { read: ElementRef }) scannerZone!: ElementRef;
  private isCameraActive = false;

  ngAfterViewInit() {
    // A small execution macro-task delay ensures Vite and Angular finish rendering layouts
    setTimeout(() => {
      this.initializeScanner();
    }, 300);
  }

  async initializeScanner() {
    if (!this.scannerZone) return;

    // Grab the exact DOM dimensions of the target viewfinder container box
    const rect = this.scannerZone.nativeElement.getBoundingClientRect();

    const options: CameraPreviewOptions = {
      parent: 'scannerZone', // Bind the camera canvas directly inside this DIV container
      position: 'rear',
      x: rect.left,
      y: rect.top,
      width: rect.width,   // Safe bounded width (e.g. ~280px) instead of full monitor screen
      height: rect.height, // Safe bounded height (e.g. ~380px)
      toBack: false,       // Keep it on top of the container base layer
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