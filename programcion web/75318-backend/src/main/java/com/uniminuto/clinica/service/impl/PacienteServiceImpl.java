package com.uniminuto.clinica.service.impl;

import com.uniminuto.clinica.entity.Paciente;
import com.uniminuto.clinica.model.PacienteRq;
import com.uniminuto.clinica.model.RespuestaRs;
import com.uniminuto.clinica.repository.PacienteRepository;
import com.uniminuto.clinica.service.PacienteService;
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
public class PacienteServiceImpl implements PacienteService {

    @Autowired
    private PacienteRepository pacienteRepository;

    @Override
    public List<Paciente> encontrarTodosLosPacientes() {
        return this.pacienteRepository.findAll();
    }

    @Override
    public Paciente buscarPacientePorDocumento(String documento) throws BadRequestException {
        Optional<Paciente> optPaciente = this.pacienteRepository.findByNumeroDocumento(documento);
        if (!optPaciente.isPresent()) {
            throw new BadRequestException("No se encuentra el paciente");
        }
        return optPaciente.get();
    }

    @Override
    public List<Paciente> listarOrdenadoPorFechaNacimiento(boolean ascendente) {
        if (ascendente) {
            return this.pacienteRepository.findAllByOrderByFechaNacimientoAsc();
        } else {
            return this.pacienteRepository.findAllByOrderByFechaNacimientoDesc();
        }
    }


    @Override
    public RespuestaRs guardarPaciente(PacienteRq pacienteNuevo)
            throws BadRequestException {
        // Paso 1. Validar que los campos llegue bien
        this.validarCampos(pacienteNuevo);
        // Paso 2. Consulto si existe el paciente por numero documento

        Optional<Paciente> optPaciente = this.pacienteRepository.
            findByNumeroDocumento(pacienteNuevo.getNumeroDocumento());
        if (optPaciente.isPresent()) {
            // Paso 3. Si existe lanzo error que ya existe el paciente
            throw new BadRequestException("El paciente ya existe.");
        }
        // Paso 4. Creo el paciente y seteo los campos que lleguen del post
        Paciente nuevo = new Paciente();
        nuevo.setUsuarioId(pacienteNuevo.getUsuarioId());
        nuevo.setTipoDocumento(pacienteNuevo.getTipoDocumento().toUpperCase());
        nuevo.setNumeroDocumento(pacienteNuevo.getNumeroDocumento());
        nuevo.setNombres(pacienteNuevo.getNombres().toUpperCase());
        nuevo.setApellidos(pacienteNuevo.getApellidos().toUpperCase());
        nuevo.setFechaNacimiento(pacienteNuevo.getFechaNacimiento().toLowerCase());
        nuevo.setGenero(pacienteNuevo.getGenero().toUpperCase());
        nuevo.setTelefono(pacienteNuevo.getTelefono());
        nuevo.setDireccion(pacienteNuevo.getDireccion().toLowerCase());

        this.pacienteRepository.save(nuevo);

        // Paso 5. Devuelve respuesta ok
        RespuestaRs rta = new RespuestaRs();
        rta.setMensaje("El paciente se ha guardado correctamente.");
        rta.setStatus(200);
        return rta;
    }


    @Override
    public RespuestaRs actualizarPaciente(PacienteRq pacienteNuevo) throws BadRequestException {
        // Paso 1. Verificar que el Numero de documento del paciente venga y pertenezca a un paciente
        Optional<Paciente> optPaciente = this.pacienteRepository.findByNumeroDocumento(pacienteNuevo.getNumeroDocumento());
        if (optPaciente.isEmpty()) {
            throw new BadRequestException("El Numero de documento del paciente no existe.");
        }

        Paciente pacienteActualizar = optPaciente.get();
        if (!pacienteActualizar.getNumeroDocumento()
                .equals(pacienteNuevo.getNumeroDocumento())) {
            // Cambio el numero de documento
            Optional<Paciente> optNumeroDocumento = this.pacienteRepository
                    .findByNumeroDocumento(pacienteNuevo.getNumeroDocumento());
            if (optNumeroDocumento.isPresent()) {
                throw new BadRequestException("El Numero de Documento de paciente ya existe.");
            }
        }

        this.validarCampos(pacienteNuevo);

        pacienteActualizar.setUsuarioId(pacienteNuevo.getUsuarioId());
        pacienteActualizar.setTipoDocumento(pacienteNuevo.getTipoDocumento().toUpperCase());
        pacienteActualizar.setNumeroDocumento(pacienteNuevo.getNumeroDocumento());
        pacienteActualizar.setNombres(pacienteNuevo.getNombres().toUpperCase());
        pacienteActualizar.setApellidos(pacienteNuevo.getApellidos().toUpperCase());
        pacienteActualizar.setFechaNacimiento(pacienteNuevo.getFechaNacimiento().toLowerCase());
        pacienteActualizar.setGenero(pacienteNuevo.getGenero().toUpperCase());
        pacienteActualizar.setTelefono(pacienteNuevo.getTelefono());
        pacienteActualizar.setDireccion(pacienteNuevo.getDireccion().toLowerCase());

        this.pacienteRepository.save(pacienteActualizar);

        RespuestaRs rta = new RespuestaRs();
        rta.setMensaje("El paciente se ha actualizado correctamente.");
        rta.setStatus(200);
        return rta;
    }



    private void validarCampos(PacienteRq pacienteNuevo)
            throws BadRequestException {
        if (pacienteNuevo.getUsuarioId() == null) {
            throw new BadRequestException("El campo UsuarioId es obligatorio.");
        }
        if (pacienteNuevo.getTipoDocumento() == null
                || pacienteNuevo.getTipoDocumento().isBlank()
                || pacienteNuevo.getTipoDocumento().isEmpty()) {
            throw new BadRequestException("El campo TipoDocumento es obligatorio.");
        }
        if (pacienteNuevo.getNumeroDocumento() == null
                || pacienteNuevo.getNumeroDocumento().isBlank()
                || pacienteNuevo.getNumeroDocumento().isEmpty()) {
            throw new BadRequestException("El campo NumeroDocumento es obligatorio.");
        }
        if (pacienteNuevo.getNombres() == null
                || pacienteNuevo.getNombres().isBlank()
                || pacienteNuevo.getNombres().isEmpty()) {
            throw new BadRequestException("El campo Nombres es obligatorio.");
        }
        if (pacienteNuevo.getApellidos() == null
                || pacienteNuevo.getApellidos().isBlank()
                || pacienteNuevo.getApellidos().isEmpty()) {
            throw new BadRequestException("El campo Apellidos es obligatorio.");
        }
        if (pacienteNuevo.getFechaNacimiento() == null
                || pacienteNuevo.getFechaNacimiento().isBlank()
                || pacienteNuevo.getFechaNacimiento().isEmpty()) {
            throw new BadRequestException("El campo FechaNacimiento es obligatorio.");
        }
        if (pacienteNuevo.getGenero() == null
                || pacienteNuevo.getGenero().isBlank()
                || pacienteNuevo.getGenero().isEmpty()) {
            throw new BadRequestException("El campo Genero es obligatorio.");
        }
        if (pacienteNuevo.getTelefono() == null
                || pacienteNuevo.getTelefono().isBlank()
                || pacienteNuevo.getTelefono().isEmpty()) {
            throw new BadRequestException("El campo Telefono es obligatorio.");
        }
        if (pacienteNuevo.getDireccion() == null
                || pacienteNuevo.getDireccion().isBlank()
                || pacienteNuevo.getDireccion().isEmpty()) {
            throw new BadRequestException("El campo Direccion es obligatorio.");
        }
    }

}
