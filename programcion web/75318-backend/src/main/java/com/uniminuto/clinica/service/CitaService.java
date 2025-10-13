package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.model.CitaRq;
import com.uniminuto.clinica.model.RespuestaRs;
import org.apache.coyote.BadRequestException;

import java.util.List;

public interface CitaService {

    /**
     * lista las citas del sistema.
     * @return lista de citas.
     */
    List<Cita> listarCitas();

    /**
     * Guarda una nueva cita en el sistema.
     * @param citaRq Cita a guardar.
     * @return Respuesta del servicio.
     * @throws BadRequestException excepcion.
     */
    RespuestaRs guardarCita(CitaRq citaRq) throws BadRequestException;

    //Acutalizar cita
    RespuestaRs actualizarCita(CitaRq citaRq) throws BadRequestException;
}
