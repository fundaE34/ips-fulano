package com.uniminuto.clinica.service.impl;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.model.EspecializacionRq;
import com.uniminuto.clinica.model.RespuestaRs;
import com.uniminuto.clinica.repository.EspecializacionRepository;
import com.uniminuto.clinica.service.EspecializacionService;
import java.util.List;
import java.util.Optional;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 *
 * @author lmora
 */
@Service
public class EspecializacionServiceImpl implements EspecializacionService {

    @Autowired
    private EspecializacionRepository repo;

    @Override
    public List<Especializacion> listarTodo() {
        return this.repo.findAll();
    }

    @Override
    public Especializacion buscarEspecializacionPorCod(String codigo)
            throws BadRequestException {
        Optional<Especializacion> optEspc = this.repo
                .findByCodigoEspecializacion(codigo);
        if (!optEspc.isPresent()) {         
            throw new BadRequestException("No se encuentra la especializacion");
        }

        return optEspc.get();
    }
    @Override
    public Especializacion buscarEspecializacionPorId(Long id)
            throws BadRequestException {
        Optional<Especializacion> optEspc = this.repo.findById(id);
        if (!optEspc.isPresent()) {
            throw new BadRequestException("No se encuentra la especialización con ID: " + id);
        }
        return optEspc.get();
    }

    @Override
    public RespuestaRs guardarEspecializacion(EspecializacionRq especializacionNuevo)
            throws BadRequestException {
        // Paso 1. Validar que los campos llegue bien
        this.validarCampos(especializacionNuevo);
        // Paso 2. Consulto si existe la especializacion por identificador

        Optional<Especializacion> optEspecializacion = this.repo.
            findByCodigoEspecializacion(especializacionNuevo.getCodigoEspecializacion());
        if (optEspecializacion.isPresent()) {
            // Paso 3. Si existe lanzo error que ya existe la especializacion
            throw new BadRequestException("La especializacion ya existe.");
        }

        // Paso 4. Creo la especializacion y seteo los campos que lleguen del post
        Especializacion nuevo = new Especializacion();
        nuevo.setNombre(especializacionNuevo.getNombre());
        nuevo.setDescripcion(especializacionNuevo.getDescripcion());
        nuevo.setCodigoEspecializacion(especializacionNuevo.getCodigoEspecializacion().toUpperCase());


        this.repo.save(nuevo);

        // Paso 5. Devuelve respuesta ok
        RespuestaRs rta = new RespuestaRs();
        rta.setMensaje("La especializacion se ha guardado correctamente.");
        rta.setStatus(200);
        return rta;
    }

    @Override
    public RespuestaRs actualizarEspecializacion(EspecializacionRq especializacionNuevo) throws BadRequestException {
        // Paso 1. Verificar que la especializacion exista
        Optional<Especializacion> optEspecializacion = this.repo.findByCodigoEspecializacion(especializacionNuevo.getCodigoEspecializacion());
        if (optEspecializacion.isEmpty()) {
            throw new BadRequestException("La especializacion no existe.");
        }

        Especializacion especializacionActualizar = optEspecializacion.get();

        // Paso 2. Validar campos
        this.validarCampos(especializacionNuevo);

        // Paso 4. Actualizar campos
        especializacionActualizar.setNombre(especializacionNuevo.getNombre());
        especializacionActualizar.setDescripcion(especializacionNuevo.getDescripcion());
        especializacionActualizar.setCodigoEspecializacion(especializacionNuevo.getCodigoEspecializacion().toUpperCase());


        // Paso 5. Guardar
        this.repo.save(especializacionActualizar);

        // Paso 6. Devolver respuesta
        RespuestaRs rta = new RespuestaRs();
        rta.setMensaje("La especializacion se ha actualizado correctamente.");
        rta.setStatus(200);
        return rta;
    }


    private void validarCampos(EspecializacionRq especializacionNuevo)
            throws BadRequestException {
        if (especializacionNuevo.getNombre() == null || especializacionNuevo.getNombre().isBlank()) {
            throw new BadRequestException("El campo Nombre es obligatorio.");
        }
        if (especializacionNuevo.getDescripcion() == null || especializacionNuevo.getDescripcion().isBlank()) {
            throw new BadRequestException("El campo Descripcion es obligatorio.");
        }
        if (especializacionNuevo.getCodigoEspecializacion() == null || especializacionNuevo.getCodigoEspecializacion().isBlank()) {
            throw new BadRequestException("El campo Codigo de Especializacion es obligatorio.");
        }
    }
}
