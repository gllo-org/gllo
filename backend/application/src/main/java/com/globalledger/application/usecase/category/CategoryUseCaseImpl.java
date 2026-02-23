package com.globalledger.application.usecase.category;

import com.globalledger.domain.exception.BusinessException;
import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Category;
import com.globalledger.domain.model.CategoryType;
import com.globalledger.domain.port.input.CategoryPort;
import com.globalledger.domain.port.output.CategoryRepositoryPort;
import com.globalledger.shared.constants.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class CategoryUseCaseImpl implements CategoryPort {

    private final CategoryRepositoryPort categoryRepository;

    @Override
    public Category create(UUID userId, String name, CategoryType type, String color) {
        Category category = Category.createCustom(userId, name, type, color);
        return categoryRepository.save(category);
    }

    @Override
    public Category update(UUID userId, Long categoryId, String name, String color) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        if (category.systemCategory()) {
            throw new BusinessException(ErrorCode.SYSTEM_CATEGORY_CANNOT_DELETE,
                    "시스템 카테고리는 수정할 수 없습니다.");
        }

        Category updatedCategory = category.update(name, color);
        return categoryRepository.save(updatedCategory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Category> getList(UUID userId) {
        return categoryRepository.findAllByUserId(userId);
    }

    @Override
    public void delete(UUID userId, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CATEGORY_NOT_FOUND));

        if (category.systemCategory()) {
            throw new BusinessException(ErrorCode.SYSTEM_CATEGORY_CANNOT_DELETE);
        }

        if (category.userId() != null && !category.userId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "다른 사용자의 카테고리는 삭제할 수 없습니다.");
        }

        categoryRepository.deleteById(categoryId);
    }
}
