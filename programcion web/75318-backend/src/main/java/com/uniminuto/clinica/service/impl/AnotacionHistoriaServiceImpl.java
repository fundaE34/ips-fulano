package com.uniminuto.clinica.service.impl;


import com.uniminuto.clinica.entity.AnotacionHistoria;
import com.uniminuto.clinica.repository.AnotacionHistoriaRepository;
import com.uniminuto.clinica.service.AnotacionHistoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnotacionHistoriaServiceImpl implements AnotacionHistoriaService {

    @Autowired
    private AnotacionHistoriaRepository anotacionHistoriaRepository;

    @Override
    public List<AnotacionHistoria> listarAnotacionHistoria() {
        return this.anotacionHistoriaRepository.findAll();
    }
}
