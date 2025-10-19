import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UsuarioComponent } from './demo/pages/usuario/usuario.component';
import { MedicoComponent } from './demo/pages/medico/medico.component';
import { PacienteComponent } from './demo/pages/paciente/paciente.component';
import { CitaComponent } from './demo/pages/cita/cita.component';
import { EspecializacionComponent } from './demo/pages/especializacion/especializacion.component';
import { FormulaComponent } from './demo/pages/formula/formula.component';
import { HistoriaComponent } from './demo/pages/historia/historia.component';
import { MedicamentoComponent } from './demo/pages/medicamento/medicamento.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },  
  {
    path: 'inicio',
    component: AdminComponent,
    data: { title: 'Inicio' },
    children: [      
       { path: 'usuario', component: UsuarioComponent, data: { title: 'Usuario' }},
       { path: 'medico', component: MedicoComponent, data: { title: 'Medico' }},
       { path: 'paciente', component: PacienteComponent, data: { title: 'Paciente' }},
       { path: 'cita', component: CitaComponent, data: { title: 'Cita' }},
       { path: 'medicamento', component: MedicamentoComponent, data: { title: 'Medicamento' }},
       { path: 'formula-medica', component: FormulaComponent, data: { title: 'Formula' }},
       { path: 'historia-clinica', component: HistoriaComponent, data: { title: 'Historia' }},
       { path: 'especializacion', component: EspecializacionComponent, data: { title: 'Especializacion' }}

    ]
  },
  { path: '**', redirectTo: 'inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
