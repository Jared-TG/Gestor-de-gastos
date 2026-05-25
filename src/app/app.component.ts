import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { cashOutline, homeOutline, qrCodeOutline, statsChartOutline, walletOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [
    IonApp,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs,
    RouterLink,
  ],
})
export class AppComponent {
  homeIcon = homeOutline;
  gastosIcon = walletOutline;
  escanearIcon = qrCodeOutline;
  resumenIcon = statsChartOutline;
}
