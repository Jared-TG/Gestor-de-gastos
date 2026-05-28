import { Component, OnInit } from '@angular/core';
import { IonButtons, IonButton, IonIcon, IonHeader, IonToolbar, IonContent, IonTitle } from "@ionic/angular/standalone";

@Component({
  selector: 'app-nuevogasto',
  templateUrl: './nuevogasto.component.html',
  styleUrls: ['./nuevogasto.component.scss'],
  standalone: true,
  imports: [IonButtons, IonButton, IonIcon, IonHeader, IonToolbar, IonContent, IonTitle],
})
export class NuevogastoComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
