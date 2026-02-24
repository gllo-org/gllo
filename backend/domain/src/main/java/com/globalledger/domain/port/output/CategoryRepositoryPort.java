package com.globalledger.domain.port.output;

import com.globalledger.domain.model.Category;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepositoryPort {
    Category save(Category category);
    Optional<Category> findById(Long id);
    Optional<Category> findByIdAndUserId(Long id, UUID userId);
    List<Category> findAllByUserId(UUID userId);
    void deleteById(Long id);
    boolean existsByUserIdAndName(UUID userId, String name);
}
