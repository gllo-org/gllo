package com.globalledger.application.usecase.category;

import com.globalledger.domain.exception.BusinessException;
import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Category;
import com.globalledger.domain.model.CategoryType;
import com.globalledger.domain.port.output.CategoryRepositoryPort;
import com.globalledger.shared.constants.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CategoryUseCaseTest {

    @Mock
    private CategoryRepositoryPort categoryRepository;

    @InjectMocks
    private CategoryUseCaseImpl categoryUseCase;

    private final UUID userId = UUID.randomUUID();
    private final Long categoryId = 1L;

    @Test
    void 커스텀_카테고리_생성_시_저장된_카테고리가_반환된다() {
        // given
        Category saved = new Category(categoryId, userId, "교통비", CategoryType.EXPENSE,
                false, "#FF5733", LocalDateTime.now());
        given(categoryRepository.save(any())).willReturn(saved);

        // when
        Category result = categoryUseCase.create(userId, "교통비", CategoryType.EXPENSE, "#FF5733");

        // then
        assertThat(result.name()).isEqualTo("교통비");
        assertThat(result.systemCategory()).isFalse();
        assertThat(result.color()).isEqualTo("#FF5733");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void 카테고리_목록_조회_시_사용자의_카테고리_목록이_반환된다() {
        // given
        List<Category> categories = List.of(
                new Category(1L, null, "식비", CategoryType.EXPENSE, true, null, LocalDateTime.now()),
                new Category(2L, userId, "교통비", CategoryType.EXPENSE, false, "#FF5733", LocalDateTime.now())
        );
        given(categoryRepository.findAllByUserId(userId)).willReturn(categories);

        // when
        List<Category> result = categoryUseCase.getList(userId);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).systemCategory()).isTrue();
        assertThat(result.get(1).systemCategory()).isFalse();
    }

    @Test
    void 커스텀_카테고리_삭제_성공() {
        // given
        Category customCategory = new Category(categoryId, userId, "교통비", CategoryType.EXPENSE,
                false, "#FF5733", LocalDateTime.now());
        given(categoryRepository.findById(categoryId)).willReturn(Optional.of(customCategory));

        // when
        categoryUseCase.delete(userId, categoryId);

        // then
        verify(categoryRepository).deleteById(categoryId);
    }

    @Test
    void 시스템_카테고리_삭제_시_SYSTEM_CATEGORY_CANNOT_DELETE_예외가_발생한다() {
        // given
        Category systemCategory = new Category(categoryId, null, "식비", CategoryType.EXPENSE,
                true, null, LocalDateTime.now());
        given(categoryRepository.findById(categoryId)).willReturn(Optional.of(systemCategory));

        // when & then
        assertThatThrownBy(() -> categoryUseCase.delete(userId, categoryId))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assert be.getErrorCode() == ErrorCode.SYSTEM_CATEGORY_CANNOT_DELETE;
                });
    }

    @Test
    void 존재하지_않는_카테고리_삭제_시_CATEGORY_NOT_FOUND_예외가_발생한다() {
        // given
        given(categoryRepository.findById(categoryId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> categoryUseCase.delete(userId, categoryId))
                .isInstanceOf(NotFoundException.class)
                .satisfies(ex -> {
                    NotFoundException ne = (NotFoundException) ex;
                    assert ne.getErrorCode() == ErrorCode.CATEGORY_NOT_FOUND;
                });
    }

    @Test
    void 다른_사용자의_카테고리_삭제_시_FORBIDDEN_예외가_발생한다() {
        // given
        UUID anotherUserId = UUID.randomUUID();
        Category otherUserCategory = new Category(categoryId, anotherUserId, "개인 카테고리",
                CategoryType.EXPENSE, false, "#000000", LocalDateTime.now());
        given(categoryRepository.findById(categoryId)).willReturn(Optional.of(otherUserCategory));

        // when & then
        assertThatThrownBy(() -> categoryUseCase.delete(userId, categoryId))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assert be.getErrorCode() == ErrorCode.FORBIDDEN;
                });
    }

    @Test
    void 시스템_카테고리_수정_시_SYSTEM_CATEGORY_CANNOT_DELETE_예외가_발생한다() {
        // given
        Category systemCategory = new Category(categoryId, null, "식비", CategoryType.EXPENSE,
                true, null, LocalDateTime.now());
        given(categoryRepository.findByIdAndUserId(categoryId, userId)).willReturn(Optional.of(systemCategory));

        // when & then
        assertThatThrownBy(() -> categoryUseCase.update(userId, categoryId, "새 이름", "#FF0000"))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assert be.getErrorCode() == ErrorCode.SYSTEM_CATEGORY_CANNOT_DELETE;
                });
    }
}
