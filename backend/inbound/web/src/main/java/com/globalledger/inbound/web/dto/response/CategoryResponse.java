package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Category;
import com.globalledger.domain.model.CategoryType;

import java.time.LocalDateTime;
import java.util.UUID;

public record CategoryResponse(
        Long id,
        UUID userId,
        String name,
        CategoryType type,
        boolean systemCategory,
        String color,
        LocalDateTime createdAt
) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.id(),
                category.userId(),
                category.name(),
                category.type(),
                category.systemCategory(),
                category.color(),
                category.createdAt()
        );
    }
}
