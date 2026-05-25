import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'gastos',
    loadComponent: () =>
      import('./pages/gastos/gastos.component').then((m) => m.GastosComponent),
  },
  {
    path: 'escanear',
    loadComponent: () =>
      import('./pages/escanear/escanear.component').then((m) => m.EscanearComponent),
  },
  {
    path: 'resumen',
    loadComponent: () =>
      import('./pages/resumen/resumen.component').then((m) => m.ResumenComponent),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
