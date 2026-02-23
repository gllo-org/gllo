package com.globalledger.domain.port.input;

import com.globalledger.domain.model.Category;
import com.globalledger.domain.model.CategoryType;

import java.util.List;
import java.util.UUID;

public interface CategoryPort {
    Category create(UUID userId, String name, CategoryType type, String color);
    Category update(UUID userId, Long categoryId, String name, String color);
    List<Category> getList(UUID userId);
    void delete(UUID userId, Long categoryId);
}
