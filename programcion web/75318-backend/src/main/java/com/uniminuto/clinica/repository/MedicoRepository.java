package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.entity.Medico;
import java.util.List;
import java.util.Optional;

import com.uniminuto.clinica.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 *
 * @author lmora
 */
@Repository
public interface MedicoRepository extends JpaRepository<Medico, Integer> {

    Optional<Medico> findByDocumento(String documento);

    List<Medico> findByEspecializacion(Especializacion e);

}
