package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Especializacion;
import java.util.List;

import com.uniminuto.clinica.model.EspecializacionRq;
import com.uniminuto.clinica.model.RespuestaRs;
import org.apache.coyote.BadRequestException;

/**
 *
 * @author lmora
 */
public interface EspecializacionService {
    List<Especializacion> listarTodo();
    
    Especializacion buscarEspecializacionPorCod(String codigo) 
            throws BadRequestException;

    Especializacion buscarEspecializacionPorId(Long id)
            throws BadRequestException;

    RespuestaRs guardarEspecializacion(EspecializacionRq especializacionNuevo) throws BadRequestException;

    RespuestaRs actualizarEspecializacion(EspecializacionRq especializacionNuevo) throws BadRequestException;

}
