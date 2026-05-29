import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'gastos',
        loadComponent: () =>
          import('./pages/gastos/gastos.component').then(
            (m) => m.GastosComponent
          ),
      },
      {
        path: 'escanear',
        loadComponent: () =>
          import('./pages/escanear/escanear.component').then(
            (m) => m.EscanearComponent
          ),
      },
      {
        path: 'resumen',
        loadComponent: () =>
          import('./pages/resumen/resumen.component').then(
            (m) => m.ResumenComponent
          ),
      },
      {
        path: 'nuevogasto',
        loadComponent: () =>
          import('./pages/nuevogasto/nuevogasto.component').then(
            (m) => m.NuevogastoComponent
          ),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
