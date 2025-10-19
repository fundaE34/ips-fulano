package com.uniminuto.clinica.service.impl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.entity.Paciente;
import com.uniminuto.clinica.model.CitaRq;
import com.uniminuto.clinica.model.RespuestaRs;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.PacienteRepository;
import com.uniminuto.clinica.service.CitaService;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class CitaServiceImpl implements CitaService {

    /**
     * Repositorio de datos para citas.
     */
    @Autowired
    private CitaRepository citaRepository;

    /**
     * Repositorio de datos para pacientes.
     */
    @Autowired
    private PacienteRepository pacienteRepository;

    /**
     * Repositorio de datos para médicos.
     */
    @Autowired
    private MedicoRepository medicoRepository;

    @Override
    public List<Cita> listarCitas() {
        return citaRepository.findAllByOrderByFechaHoraDesc();
    }

    @Override
    public RespuestaRs guardarCita(CitaRq citaRq) throws BadRequestException {
        Optional<Paciente> optPaciente = this.pacienteRepository.findById(citaRq.getPacienteId());
        if (optPaciente.isEmpty()) {
            throw new BadRequestException("El paciente con ID " + citaRq.getPacienteId() + " no existe.");
        }

        Optional<Medico> optMedico = this.medicoRepository.findById(citaRq.getMedicoId());
        if (optMedico.isEmpty()) {
           throw new BadRequestException("El médico con ID " + citaRq.getMedicoId() + " no existe.");
        }

        LocalDateTime fechaInicio = LocalDateTime.parse(citaRq.getFechaHora(),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        LocalDateTime fechaFin = fechaInicio.plusMinutes(20);

        List<Cita> citasDelMedico = this.citaRepository
                .findByMedicoAndFechaHoraBetween(optMedico.get(), fechaInicio, fechaFin);

        if (!citasDelMedico.isEmpty()) {
            throw new BadRequestException("El médico ya tiene una cita programada en ese horario.");
        }

        List<Cita> citasDelPaciente = this.citaRepository
                .findByPacienteAndFechaHoraBetween(optPaciente.get(), fechaInicio, fechaFin);

        if (!citasDelPaciente.isEmpty()) {
            throw new BadRequestException("El paciente ya tiene una cita programada en ese horario.");
        }

        Cita citaNueva = this.converterToCita(citaRq, optPaciente.get(), optMedico.get());
        this.citaRepository.save(citaNueva);
        RespuestaRs rta = new RespuestaRs();
        rta.setStatus(200);
        rta.setMensaje("Cita creada exitosamente.");
        return rta;
    }

    /**
     * Convierte un objeto CitaRq a una entidad Cita.
     * @param citaRq objeto de entrada.
     * @param paciente paciente de la cita.
     * @param medico medico de la cita.
     * @return entidad Cita.
     */
    private Cita converterToCita(CitaRq citaRq, Paciente paciente, Medico medico) {
        Cita cita = new Cita();
        cita.setEstado(citaRq.getEstado());
        cita.setMotivo(citaRq.getMotivo());
        cita.setFechaHora(LocalDateTime.parse(citaRq.getFechaHora(),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        cita.setPaciente(paciente);
        cita.setMedico(medico);
        return cita;
    }

    @Override
    public RespuestaRs actualizarCita(CitaRq citaRq) throws BadRequestException {
        // Paso 1. Validar que el ID de la cita venga en el request
        if (citaRq.getId() == null) {
            throw new BadRequestException("El ID de la cita es obligatorio para actualizar.");
        }

        // Paso 2. Verificar que la cita existe
        Optional<Cita> optCita = this.citaRepository.findById(citaRq.getId());
        if (optCita.isEmpty()) {
            throw new BadRequestException("La cita con ID " + citaRq.getId() + " no existe.");
        }

        // Paso 3. Validar que el paciente existe
        Optional<Paciente> optPaciente = this.pacienteRepository.findById(citaRq.getPacienteId());
        if (optPaciente.isEmpty()) {
            throw new BadRequestException("El paciente con ID " + citaRq.getPacienteId() + " no existe.");
        }

        // Paso 4. Validar que el médico existe
        Optional<Medico> optMedico = this.medicoRepository.findById(citaRq.getMedicoId());
        if (optMedico.isEmpty()) {
            throw new BadRequestException("El médico con ID " + citaRq.getMedicoId() + " no existe.");
        }

        // Paso 5. Parsear la fecha
        LocalDateTime fechaInicio = LocalDateTime.parse(citaRq.getFechaHora(),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        LocalDateTime fechaFin = fechaInicio.plusMinutes(20);

        // Paso 6. Validar que el médico no tenga otra cita en ese horario
        // (EXCLUYENDO la cita actual que estamos actualizando)
        List<Cita> citasDelMedico = this.citaRepository
                .findByMedicoAndFechaHoraBetween(optMedico.get(), fechaInicio, fechaFin);

        // Filtrar para excluir la cita actual
        citasDelMedico = citasDelMedico.stream()
                .filter(c -> !c.getId().equals(citaRq.getId()))
                .collect(java.util.stream.Collectors.toList());

        if (!citasDelMedico.isEmpty()) {
            throw new BadRequestException("El médico ya tiene otra cita programada en ese horario.");
        }

        // Paso 7. Validar que el paciente no tenga otra cita en ese horario
        // (EXCLUYENDO la cita actual)
        List<Cita> citasDelPaciente = this.citaRepository
                .findByPacienteAndFechaHoraBetween(optPaciente.get(), fechaInicio, fechaFin);

        citasDelPaciente = citasDelPaciente.stream()
                .filter(c -> !c.getId().equals(citaRq.getId()))
                .collect(java.util.stream.Collectors.toList());

        if (!citasDelPaciente.isEmpty()) {
            throw new BadRequestException("El paciente ya tiene otra cita programada en ese horario.");
        }

        // Paso 8. Obtener la cita existente y actualizarla
        Cita citaActual = optCita.get();

        // Actualizar campos usando el converter (reutilizamos el método)
        Cita citaActualizada = this.converterToCita(citaRq, optPaciente.get(), optMedico.get());

        // Mantener el ID original
        citaActualizada.setId(citaActual.getId());

        // Paso 9. Guardar la cita actualizada
        this.citaRepository.save(citaActualizada);

        // Paso 10. Devolver respuesta
        RespuestaRs rta = new RespuestaRs();
        rta.setStatus(200);
        rta.setMensaje("Cita actualizada exitosamente.");
        return rta;
    }

}
