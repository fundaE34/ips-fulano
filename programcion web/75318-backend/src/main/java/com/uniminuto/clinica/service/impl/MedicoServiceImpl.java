package com.uniminuto.clinica.service.impl;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.model.MedicoRq;
import com.uniminuto.clinica.model.PacienteRq;
import com.uniminuto.clinica.model.RespuestaRs;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.EspecializacionService;
import com.uniminuto.clinica.service.MedicoService;
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
public class MedicoServiceImpl implements MedicoService {

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private EspecializacionService especializacionService;

    @Override
    public List<Medico> listarMedicos() {
        return this.medicoRepository.findAll();
    }


    @Override
    public Medico buscarMedicoPorDocumento(String documento) throws BadRequestException {
        Optional<Medico> optMedico = this.medicoRepository.findByDocumento(documento);
        if (!optMedico.isPresent()) {
            throw new BadRequestException("No se encuentra el medico");
        }
        return optMedico.get();
    }


    @Override
    public List<Medico> buscarPorEspecialidad(String codigo)
            throws BadRequestException {
        try {
            Especializacion e = this.especializacionService
                    .buscarEspecializacionPorCod(codigo);
            return this.medicoRepository.findByEspecializacion(e);
        } catch (BadRequestException e) {
            throw e;
        }
    }


    @Override
    public RespuestaRs guardarMedico(MedicoRq medicoNuevo)
            throws BadRequestException {
        // Paso 1. Validar que los campos llegue bien
        this.validarCampos(medicoNuevo);
        // Paso 2. Consulto si existe el medico por numero documento

        Optional<Medico> optMedico = this.medicoRepository.
            findByDocumento(medicoNuevo.getDocumento());
        if (optMedico.isPresent()) {
            // Paso 3. Si existe lanzo error que ya existe el medico
            throw new BadRequestException("El medico ya existe.");
        }

        Especializacion especializacion = this.especializacionService
                .buscarEspecializacionPorId(medicoNuevo.getEspecializacionId());

        // Paso 4. Creo el medico y seteo los campos que lleguen del post
        Medico nuevo = new Medico();
        nuevo.setTipoDocumento(medicoNuevo.getTipoDocumento().toUpperCase());
        nuevo.setDocumento(medicoNuevo.getDocumento());
        nuevo.setNombres(medicoNuevo.getNombres());
        nuevo.setApellidos(medicoNuevo.getApellidos());
        nuevo.setTelefono(medicoNuevo.getTelefono());
        nuevo.setRegistroProfesional(medicoNuevo.getRegistroProfesional());
        //setea el objeto completo no el id
        nuevo.setEspecializacion(especializacion);

        this.medicoRepository.save(nuevo);

        // Paso 5. Devuelve respuesta ok
        RespuestaRs rta = new RespuestaRs();
        rta.setMensaje("El medico se ha guardado correctamente.");
        rta.setStatus(200);
        return rta;
    }

    @Override
    public RespuestaRs actualizarMedico(MedicoRq medicoNuevo) throws BadRequestException {
        // Paso 1. Verificar que el médico exista
        Optional<Medico> optMedico = this.medicoRepository.findByDocumento(medicoNuevo.getDocumento());
        if (optMedico.isEmpty()) {
            throw new BadRequestException("El médico no existe.");
        }

        Medico medicoActualizar = optMedico.get();

        // Paso 2. Validar campos
        this.validarCampos(medicoNuevo);

        // Paso 3. ✅ Obtener la especialización si cambió
        Especializacion especializacion = this.especializacionService
                .buscarEspecializacionPorId(medicoNuevo.getEspecializacionId());

        // Paso 4. Actualizar campos
        medicoActualizar.setTipoDocumento(medicoNuevo.getTipoDocumento().toUpperCase());
        medicoActualizar.setNombres(medicoNuevo.getNombres());
        medicoActualizar.setApellidos(medicoNuevo.getApellidos());
        medicoActualizar.setTelefono(medicoNuevo.getTelefono());
        medicoActualizar.setRegistroProfesional(medicoNuevo.getRegistroProfesional());

        // ✅ CORRECTO: Setear el OBJETO completo
        medicoActualizar.setEspecializacion(especializacion);

        // Paso 5. Guardar
        this.medicoRepository.save(medicoActualizar);

        // Paso 6. Devolver respuesta
        RespuestaRs rta = new RespuestaRs();
        rta.setMensaje("El médico se ha actualizado correctamente.");
        rta.setStatus(200);
        return rta;
    }


    private void validarCampos(MedicoRq medicoNuevo)
            throws BadRequestException {
        if (medicoNuevo.getTipoDocumento() == null || medicoNuevo.getTipoDocumento().isBlank()) {
            throw new BadRequestException("El campo TipoDocumento es obligatorio.");
        }
        if (medicoNuevo.getDocumento() == null || medicoNuevo.getDocumento().isBlank()) {
            throw new BadRequestException("El campo Documento es obligatorio.");
        }
        if (medicoNuevo.getNombres() == null || medicoNuevo.getNombres().isBlank()) {
            throw new BadRequestException("El campo Nombres es obligatorio.");
        }
        if (medicoNuevo.getApellidos() == null || medicoNuevo.getApellidos().isBlank()) {
            throw new BadRequestException("El campo Apellidos es obligatorio.");
        }
        if (medicoNuevo.getTelefono() == null || medicoNuevo.getTelefono().isBlank()) {
            throw new BadRequestException("El campo Teléfono es obligatorio.");
        }
        if (medicoNuevo.getRegistroProfesional() == null || medicoNuevo.getRegistroProfesional().isBlank()) {
            throw new BadRequestException("El campo RegistroProfesional es obligatorio.");
        }
        if (medicoNuevo.getEspecializacionId() == null) {
            throw new BadRequestException("El campo EspecializacionId es obligatorio.");
        }
    }

}
