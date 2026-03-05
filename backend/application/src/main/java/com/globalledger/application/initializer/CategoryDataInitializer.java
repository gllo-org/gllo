package com.globalledger.application.initializer;

import com.globalledger.domain.model.Category;
import com.globalledger.domain.model.CategoryType;
import com.globalledger.domain.port.output.CategoryRepositoryPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CategoryDataInitializer implements ApplicationRunner {

    private final CategoryRepositoryPort categoryRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initializeSystemCategories();
    }

    private void initializeSystemCategories() {
        if (categoryRepository.hasSystemCategories()) {
            log.info("시스템 카테고리 이미 존재함. 초기화 건너뜀.");
            return;
        }

        List<Category> systemCategories = List.of(
                Category.createSystem("급여", CategoryType.INCOME, "💼"),
                Category.createSystem("용돈", CategoryType.INCOME, "💰"),
                Category.createSystem("상여금", CategoryType.INCOME, "🎁"),
                Category.createSystem("기타수입", CategoryType.INCOME, "💚"),

                Category.createSystem("식비", CategoryType.EXPENSE, "🍜"),
                Category.createSystem("교통비", CategoryType.EXPENSE, "🚌"),
                Category.createSystem("주거비", CategoryType.EXPENSE, "🏡"),
                Category.createSystem("통신비", CategoryType.EXPENSE, "📱"),
                Category.createSystem("쇼핑", CategoryType.EXPENSE, "🛍️"),
                Category.createSystem("의료", CategoryType.EXPENSE, "🏥"),
                Category.createSystem("문화생활", CategoryType.EXPENSE, "🎭"),
                Category.createSystem("교육", CategoryType.EXPENSE, "📚"),
                Category.createSystem("기타지출", CategoryType.EXPENSE, "💸")
        );

        for (Category category : systemCategories) {
            try {
                categoryRepository.save(category);
                log.info("시스템 카테고리 초기화 완료: {}", category.name());
            } catch (Exception e) {
                log.debug("이미 존재하는 시스템 카테고리: {}", category.name());
            }
        }

        log.info("시스템 카테고리 초기화 프로세스 완료");
    }
}
