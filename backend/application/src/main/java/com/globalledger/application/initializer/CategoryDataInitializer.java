package com.globalledger.application.initializer;

import com.globalledger.domain.port.output.CategoryRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class CategoryDataInitializer implements ApplicationRunner {

    private final CategoryRepositoryPort categoryRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
    }
}
