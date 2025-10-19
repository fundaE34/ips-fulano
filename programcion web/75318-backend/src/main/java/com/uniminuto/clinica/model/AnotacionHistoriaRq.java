package com.uniminuto.clinica.model;

import lombok.Data;

@Data
public class AnotacionHistoriaRq {
    private Long id;
    private Long historiaMedicaId;
    private Integer medicoId;
    private String descripcion;
}
