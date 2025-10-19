import { Component } from '@angular/core';
import { PacienteService } from './service/paciente.service';
import { Paciente } from './models/paciente';
import { CommonModule } from '@angular/common';

// Import library module
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import Swal from 'sweetalert2';
// Importa los objetos necesarios de Bootstrap
import Modal from 'bootstrap/js/dist/modal';

import { FormBuilder, FormGroup, Validators, AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-paciente',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxSpinnerModule],
  templateUrl: './paciente.component.html',
  styleUrl: './paciente.component.scss'
})
export class PacienteComponent {
  modalInstance: Modal | null = null;
  modoFormulario: string = '';
  pacientes: Paciente[] = [];
  pacientesOriginal: Paciente[] = []; // Guarda la lista original filtros*
  pacientesFiltrados: Paciente[] = []; // Lista filtrada para mostrar filtros*
  titleModal: string = '';
  titleBoton: string = '';
  pacienteSelected: Paciente;
  titleSpinner: string = "Cargando...";

  form: FormGroup;

  constructor(
    private readonly pacienteService: PacienteService,
    private readonly formBuilder: FormBuilder,
    private readonly spinner: NgxSpinnerService

  ) {
    this.listarPacientes();
    this.inicializarFormulario();
  }

  inicializarFormulario() {
    this.form = this.formBuilder.group({
      usuarioId: ['', [Validators.required]],
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      fechaNacimiento: ['', [Validators.required]],
      genero: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      direccion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]]
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  listarPacientes() {
    this.spinner.show();
    this.pacienteService.listarPaciente().subscribe({
      next: (data) => {
        this.pacientes = data;
        this.pacientesFiltrados = [...data];//filtros*
        console.log('Pacientes:', this.pacientes);
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error al listar pacientes', error);
        this.spinner.hide();
      }
    });
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.limpiarFormulario();
  }

  openModal(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Paciente' : 'Editar Paciente';
    this.titleBoton = modo === 'C' ? 'Guardar Paciente' : 'Actualizar Paciente';
    this.modoFormulario = modo;
    const modalElement = document.getElementById('modalCrearPaciente');
    if (modalElement) {
      // Verificar si ya existe una instancia del modal
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  abrirNuevoPaciente() {
    this.pacienteSelected = null;
    this.openModal('C');
  }

  abrirEditarPaciente(paciente: Paciente) {
    this.pacienteSelected = paciente;
    this.openModal('E');
  }

  /**
   * Funcion que permite guardar/actualizar un paciente.
   */
  guardarPaciente() {
    this.titleSpinner = this.modoFormulario === 'C' ? "Creando paciente..." : "Actualizando paciente...";
    this.spinner.show();
    if (this.modoFormulario === 'C') {
      this.form.get('activo')?.setValue(true);
    }
    if (this.form.invalid) {
      // Manejar el formulario inválido
      this.spinner.hide();
      Swal.fire('Error', 'Por favor, corrige los errores en el formulario.', 'error');
      return;
    }

    if (this.modoFormulario === 'C') {
      // Modo Creación
      this.pacienteService.guardarPaciente(this.form.getRawValue()).subscribe({
        next: (data) => {
          if (data.status === 200) {
            this.spinner.hide();
            Swal.fire('Éxito', data.mensaje, 'success');
            this.closeModal();
            this.listarPacientes();
          } else {
            this.spinner.hide();
            Swal.fire('Error', data.mensaje, 'error');
          }
        },
        error: (error) => {
          this.spinner.hide();
          Swal.fire('Error', error.error.message, 'error');
        }
      });
    } else {
      // Modo Edición
      const pacienteActualizado: Paciente = this.form.getRawValue();
      pacienteActualizado.id = this.pacienteSelected.id;
      this.pacienteService.actualizarPaciente(pacienteActualizado).subscribe({
        next: (data) => {
          if (data.status === 200) {
            this.spinner.hide();
            Swal.fire('Éxito', data.mensaje, 'success');
            this.closeModal();
            this.listarPacientes();
          } else {
            this.spinner.hide();
            Swal.fire('Error', data.mensaje, 'error');
          }
        },
        error: (error) => {
          this.spinner.hide();
          Swal.fire('Error', error.error.message, 'error');
        }
      });
    }
  }

  limpiarFormulario() {
    this.form.reset({
      usuarioId: this.pacienteSelected ? this.pacienteSelected.usuarioId : '',
      tipoDocumento: this.pacienteSelected ? this.pacienteSelected.tipoDocumento : '',
      numeroDocumento: this.pacienteSelected ? this.pacienteSelected.numeroDocumento : '',
      nombres: this.pacienteSelected ? this.pacienteSelected.nombres : '',
      apellidos: this.pacienteSelected ? this.pacienteSelected.apellidos : '',
      fechaNacimiento: this.pacienteSelected ? this.pacienteSelected.fechaNacimiento : '',
      genero: this.pacienteSelected ? this.pacienteSelected.genero : '',
      telefono: this.pacienteSelected ? this.pacienteSelected.telefono : '',
      direccion: this.pacienteSelected ? this.pacienteSelected.direccion : ''
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
//filtros*
 filtrarTabla(event: Event) {
  const input = event.target as HTMLInputElement;
  const texto = input.value.toLowerCase().trim();
  
  if (!texto) {
    this.pacientesFiltrados = [...this.pacientes];
    return;
  }

  this.pacientesFiltrados = this.pacientes.filter(paciente => 
    paciente.id.toString().includes(texto) ||
    paciente.usuarioId.toString().includes(texto) ||
    (paciente.tipoDocumento && paciente.tipoDocumento.toLowerCase().includes(texto)) ||
    (paciente.numeroDocumento && paciente.numeroDocumento.toLowerCase().includes(texto)) ||
    (paciente.nombres && paciente.nombres.toLowerCase().includes(texto)) ||
    (paciente.apellidos && paciente.apellidos.toLowerCase().includes(texto)) ||
    (paciente.fechaNacimiento && paciente.fechaNacimiento.includes(texto)) ||
    (paciente.genero && paciente.genero.toLowerCase().includes(texto)) ||
    (paciente.telefono && paciente.telefono.includes(texto)) ||
    (paciente.direccion && paciente.direccion.toLowerCase().includes(texto))
  );
}

// Filtro por campo específico
filtrarPorCampo(campo: keyof Paciente, event: Event) {
  const select = event.target as HTMLSelectElement;
  const valor = select.value;
  
  if (!valor) {
    this.pacientesFiltrados = [...this.pacientes];
    return;
  }

  this.pacientesFiltrados = this.pacientes.filter(paciente => 
    paciente[campo] === valor
  );
}

// Ordenar la tabla
ordenarTabla(event: Event) {
  const select = event.target as HTMLSelectElement;
  const criterio = select.value;
  
  if (!criterio) {
    this.pacientesFiltrados = [...this.pacientes];
    return;
  }

  this.pacientesFiltrados = [...this.pacientesFiltrados].sort((a, b) => {
    switch (criterio) {
      case 'nombres':
        return a.nombres.localeCompare(b.nombres);
      case 'nombres_desc':
        return b.nombres.localeCompare(a.nombres);
      case 'fechaNacimiento':
        return new Date(a.fechaNacimiento).getTime() - new Date(b.fechaNacimiento).getTime();
      case 'fechaNacimiento_desc':
        return new Date(b.fechaNacimiento).getTime() - new Date(a.fechaNacimiento).getTime();
      case 'id':
        return a.id - b.id;
      case 'id_desc':
        return b.id - a.id;
      default:
        return 0;
    }
  });
}

// Limpiar todos los filtros
limpiarFiltros() {
  this.pacientesFiltrados = [...this.pacientes];
  
  // Limpiar inputs con tipos específicos
  const inputs = document.querySelectorAll('input, select');
  inputs.forEach((input: Element) => {
    if (input instanceof HTMLInputElement && input.type === 'text') {
      input.value = '';
    } else if (input instanceof HTMLSelectElement) {
      input.value = '';
    }
  });
}
}