import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon, IonButtons, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, calendarOutline, chevronForwardOutline, notificationsOutline, personCircle, qrCodeOutline, restaurantOutline, trendingUpOutline, walletOutline } from 'ionicons/icons';

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
    IonTitle,
    RouterModule
],
})
export class HomePage {
  constructor(private router: Router) {
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

  addGasto() {
    this.router.navigate(['/nuevogasto']);
  }
}
