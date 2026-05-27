import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonButtons, IonButton, IonCard } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, calendarOutline, chevronForwardOutline, notificationsOutline, personCircle, qrCodeOutline, restaurantOutline, scanOutline, trendingUpOutline, walletOutline } from 'ionicons/icons';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButtons,
    IonButton,
],
})
export class HomePage {
  constructor() {
    addIcons({
      add,
      calendarOutline,
      chevronForwardOutline,
      notificationsOutline,
      personCircle,
      restaurantOutline,
      qrCodeOutline,
      trendingUpOutline,
      walletOutline
    });
  }
}
