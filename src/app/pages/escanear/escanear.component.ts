import { Component, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-escanear',
  templateUrl: './escanear.component.html',
  styleUrls: ['./escanear.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class EscanearComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
