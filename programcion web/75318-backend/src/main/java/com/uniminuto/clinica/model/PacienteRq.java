package com.uniminuto.clinica.model;

import lombok.Data;

@Data
public class PacienteRq {
    private Integer id;
    private Integer usuarioId;
    private String tipoDocumento;
    private String numeroDocumento;
    private String nombres;
    private String apellidos;
    private String fechaNacimiento;
    private String genero;
    private String telefono;
    private String direccion;
}
