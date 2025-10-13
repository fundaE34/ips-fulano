package com.uniminuto.clinica.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CitaDTO {
    private Long id;
    private LocalDateTime fechaCita;
    private String motivo;
    private String estado;

    private Long medicoId;
    private String nombreMedico;

    private Long pacienteId;
    private String nombrePaciente;
}