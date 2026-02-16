package com.globalledger.infra.jpa.adapter;

import com.globalledger.domain.model.Category;
import com.globalledger.domain.port.output.CategoryRepositoryPort;
import com.globalledger.infra.jpa.mapper.CategoryMapper;
import com.globalledger.infra.jpa.repository.CategoryJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class CategoryRepositoryAdapter implements CategoryRepositoryPort {

    private final CategoryJpaRepository categoryJpaRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public Category save(Category category) {
        return categoryMapper.toDomain(categoryJpaRepository.save(categoryMapper.toEntity(category)));
    }

    @Override
    public Optional<Category> findById(Long id) {
        return categoryJpaRepository.findById(id).map(categoryMapper::toDomain);
    }

    @Override
    public Optional<Category> findByIdAndUserId(Long id, UUID userId) {
        return categoryJpaRepository.findByIdAndUserId(id, userId).map(categoryMapper::toDomain);
    }

    @Override
    public List<Category> findAllByUserId(UUID userId) {
        return categoryJpaRepository.findAllByUserId(userId).stream()
                .map(categoryMapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(Long id) {
        categoryJpaRepository.deleteById(id);
    }
}
