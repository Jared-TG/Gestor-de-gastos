import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PwaInstallBannerComponent } from './shared/pwa-install-banner/pwa-install-banner.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, PwaInstallBannerComponent],
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) {}

  async ngOnInit() {
    await this.authService.inicializar();
  }
}
