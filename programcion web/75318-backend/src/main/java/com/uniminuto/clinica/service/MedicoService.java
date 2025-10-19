package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Medico;
import java.util.List;

import com.uniminuto.clinica.model.MedicoRq;
import com.uniminuto.clinica.model.RespuestaRs;
import org.apache.coyote.BadRequestException;

/**
 *
 * @author lmora
 */
public interface MedicoService {
   List<Medico> listarMedicos(); 
   
   List<Medico> buscarPorEspecialidad(String codigo) 
           throws BadRequestException;

   Medico buscarMedicoPorDocumento(String documento) throws BadRequestException;

   RespuestaRs guardarMedico(MedicoRq medicoNuevo) throws BadRequestException;

   RespuestaRs actualizarMedico(MedicoRq medicoNuevo) throws BadRequestException;

}
