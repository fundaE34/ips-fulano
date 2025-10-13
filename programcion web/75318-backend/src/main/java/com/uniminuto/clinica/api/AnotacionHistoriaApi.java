package com.uniminuto.clinica.api;


import com.uniminuto.clinica.entity.AnotacionHistoria;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;

@CrossOrigin(origins = "*")
@RequestMapping("/anotacion_historia")
public interface AnotacionHistoriaApi {

    @RequestMapping(value = "/listar",
            produces = {"application/json"},
            consumes = {"application/json"},
            method = RequestMethod.GET)
    ResponseEntity<List<AnotacionHistoria>> listarAnotacionHistoria();

}
