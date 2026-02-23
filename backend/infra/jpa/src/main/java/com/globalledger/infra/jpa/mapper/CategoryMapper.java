package com.globalledger.infra.jpa.mapper;

import com.globalledger.domain.model.Category;
import com.globalledger.domain.model.CategoryType;
import com.globalledger.infra.jpa.entity.CategoryEntity;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category toDomain(CategoryEntity entity) {
        return new Category(
                entity.getId(),
                entity.getUserId(),
                entity.getName(),
                CategoryType.valueOf(entity.getType()),
                entity.isSystemCategory(),
                entity.getColor(),
                entity.getCreatedAt()
        );
    }

    public CategoryEntity toEntity(Category domain) {
        return CategoryEntity.builder()
                .id(domain.id())
                .userId(domain.userId())
                .name(domain.name())
                .type(domain.type().name())
                .systemCategory(domain.systemCategory())
                .color(domain.color())
                .createdAt(domain.createdAt())
                .build();
    }
}
