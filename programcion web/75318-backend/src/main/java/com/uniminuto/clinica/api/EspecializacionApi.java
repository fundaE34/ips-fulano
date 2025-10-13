package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Especializacion;
import java.util.List;

import com.uniminuto.clinica.model.EspecializacionRq;
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
@RequestMapping("/especializacion")
public interface EspecializacionApi {
    
    @RequestMapping(value = "/listar",
            produces = {"application/json"},
            consumes = {"application/json"},
            method = RequestMethod.GET)
    ResponseEntity<List<Especializacion>> listarEspecializaciones();
    
    
    @RequestMapping(value = "/buscar-por-codigo",
            produces = {"application/json"},
            consumes = {"application/json"},
            method = RequestMethod.GET)
    ResponseEntity<Especializacion> buscarPorCodigo(
      @RequestParam String codigo
    ) throws BadRequestException;

    @RequestMapping(value = "/buscar-por-id/{id}",
            produces = {"application/json"},
            consumes = {"application/json"},
            method = RequestMethod.GET)
    ResponseEntity<Especializacion> buscarPorId(@PathVariable Long id)
            throws BadRequestException;



    // TODO Agregar medodo para guardar especializacion.
    @RequestMapping(value = "/guardar",
            produces = {"application/json"},
            consumes = {"application/json"},
            method = RequestMethod.POST)
    ResponseEntity<RespuestaRs> guardarEspecializacion(
            @RequestBody EspecializacionRq especializacionNuevo
    ) throws BadRequestException;





    // TODO agregar metodo para actualizar especializacion.
    @RequestMapping(value = "/actualizar",
            produces = {"application/json"},
            consumes = {"application/json"},
            method = RequestMethod.POST)
    ResponseEntity<RespuestaRs> actualizarEspecializacion(
            @RequestBody EspecializacionRq especializacion
    ) throws BadRequestException;


}
