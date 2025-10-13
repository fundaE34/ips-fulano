package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.EspecializacionApi;
import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.model.EspecializacionRq;
import com.uniminuto.clinica.model.MedicoRq;
import com.uniminuto.clinica.model.RespuestaRs;
import com.uniminuto.clinica.service.EspecializacionService;
import java.util.List;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/**
 *
 * @author lmora
 */
@RestController
public class EspecializacionApiController implements EspecializacionApi {
    
    @Autowired
    private EspecializacionService servicio;

    @Override
    public ResponseEntity<List<Especializacion>> listarEspecializaciones() {
        return ResponseEntity.ok(this.servicio.listarTodo());
    }

    @Override
    public ResponseEntity<Especializacion> buscarPorCodigo(String codigo) 
            throws BadRequestException {
        return ResponseEntity.ok(this.servicio
                .buscarEspecializacionPorCod(codigo));
    }

    @Override
    public ResponseEntity<Especializacion> buscarPorId(Long id)
            throws BadRequestException {
        return ResponseEntity.ok(this.servicio.buscarEspecializacionPorId(id));
    }

    @Override
    public ResponseEntity<RespuestaRs> guardarEspecializacion(EspecializacionRq especializacionNuevo)
            throws BadRequestException {
        return ResponseEntity.ok(this.servicio.guardarEspecializacion(especializacionNuevo));
    }

    @Override
    public ResponseEntity<RespuestaRs> actualizarEspecializacion(EspecializacionRq especializacion)
            throws BadRequestException {
        return ResponseEntity.ok(this.servicio.actualizarEspecializacion(especializacion));
    }
}
