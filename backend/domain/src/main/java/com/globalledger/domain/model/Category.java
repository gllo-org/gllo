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
        String emoji,
        LocalDateTime createdAt
) {
    public static Category createSystem(String name, CategoryType type, String emoji) {
        return new Category(null, null, name, type, true, null, emoji, LocalDateTime.now());
    }

    public static Category createCustom(UUID userId, String name, CategoryType type, String color, String emoji) {
        return new Category(null, userId, name, type, false, color, emoji, LocalDateTime.now());
    }

    public static Category createUserDefault(UUID userId, String name, CategoryType type, String color, String emoji) {
        return new Category(null, userId, name, type, true, color, emoji, LocalDateTime.now());
    }

    public Category update(String newName, String newColor, String newEmoji) {
        return new Category(id, userId, newName, type, systemCategory, newColor, newEmoji, createdAt);
    }
}
