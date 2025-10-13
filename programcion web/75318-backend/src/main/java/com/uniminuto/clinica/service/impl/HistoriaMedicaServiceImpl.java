package com.uniminuto.clinica.service.impl;

import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.repository.HistoriaMedicaRepository;
import com.uniminuto.clinica.service.HistoriaMedicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HistoriaMedicaServiceImpl implements HistoriaMedicaService {

    @Autowired
    private HistoriaMedicaRepository historiaMedicaRepository;

    @Override
    public List<HistoriaMedica> listarHistoriaMedica() {
        return this.historiaMedicaRepository.findAll();
    }

}
