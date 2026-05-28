import { Component, OnInit } from '@angular/core';
import { IonButtons, IonButton, IonIcon, IonHeader, IonToolbar, IonContent, IonTitle, IonBackButton } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { personCircle } from 'ionicons/icons';

@Component({
  selector: 'app-nuevogasto',
  templateUrl: './nuevogasto.component.html',
  styleUrls: ['./nuevogasto.component.scss'],
  standalone: true,
  imports: [
    IonButtons,
    IonButton,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonContent,
    IonTitle,
    IonBackButton
  ],
})
export class NuevogastoComponent implements OnInit {

  constructor() {
    addIcons({
      personCircle
    })
  }


  ngOnInit() { }

}
