package com.uniminuto.clinica.service.impl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.service.CitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/citas")
public class CitaApiController {

    @Autowired
    private CitaService citaService;

    @PostMapping("/guardar")
    public ResponseEntity<Cita> guardarCita(@RequestBody Cita cita) {
        // Asegúrate de que el nombre del método en el servicio es correcto
        Cita nuevaCita = citaService.guardarCita(cita);
        return ResponseEntity.ok(nuevaCita);
    }
}