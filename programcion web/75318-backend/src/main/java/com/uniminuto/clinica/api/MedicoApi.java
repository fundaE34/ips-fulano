package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Medico;
import java.util.List;

import com.uniminuto.clinica.model.MedicoRq;
import com.uniminuto.clinica.model.RespuestaRs;
import org.apache.coyote.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 *
 * @author lmora
 */
@CrossOrigin(origins = "*")
@RequestMapping("/medico")
public interface MedicoApi {
    
    @RequestMapping(value = "/listar",
            produces = {"application/json"},
            consumes = {"application/json"},
            method = RequestMethod.GET)
    ResponseEntity<List<Medico>> listarMedicos();
    
    
    @RequestMapping(value = "/listar-x-cod-esp",
            produces = {"application/json"},
            consumes = {"application/json"},
            method = RequestMethod.GET)
    ResponseEntity<List<Medico>> listarMedicosporEspecialidad(
      @RequestParam String codigo
    ) throws BadRequestException;

    @RequestMapping(value = "/buscar-medico-documento",
            produces = {"application/json"},
            consumes = {"application/json"},
            method = RequestMethod.GET)
    ResponseEntity<Medico> buscarMedicoPorDocumento(
            @RequestParam String documento)
            throws BadRequestException;


    /*
     * TODO Agregar medodo para guardar medico.*/
    @RequestMapping(value = "/guardar",
        produces = {"application/json"},
        consumes = {"application/json"},
        method = RequestMethod.POST)
    ResponseEntity<RespuestaRs> guardarMedico(
       @RequestBody MedicoRq medicoNuevo
    ) throws BadRequestException;




    /*
     * TODO agregar metodo para actualizar medico.*/
    @RequestMapping(value = "/actualizar",
            produces = {"application/json"},
            consumes = {"application/json"},
            method = RequestMethod.POST)
    ResponseEntity<RespuestaRs> actualizarMedico(
            @RequestBody MedicoRq medico
    ) throws BadRequestException;

}
