package com.globalledger.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

public record Category(
        Long id,
        UUID userId,
        String name,
        CategoryType type,
        boolean systemCategory,
        String color,
        LocalDateTime createdAt
) {
    public static Category createSystem(String name, CategoryType type) {
        return new Category(null, null, name, type, true, null, LocalDateTime.now());
    }

    public static Category createCustom(UUID userId, String name, CategoryType type, String color) {
        return new Category(null, userId, name, type, false, color, LocalDateTime.now());
    }

    public Category update(String newName, String newColor) {
        return new Category(id, userId, newName, type, systemCategory, newColor, createdAt);
    }
}
