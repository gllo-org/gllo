package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Category;
import com.globalledger.domain.port.input.CategoryPort;
import com.globalledger.inbound.web.dto.request.CreateCategoryRequest;
import com.globalledger.inbound.web.dto.request.UpdateCategoryRequest;
import com.globalledger.inbound.web.dto.response.CategoryResponse;
import com.globalledger.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryPort categoryUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CreateCategoryRequest request) {

        Category category = categoryUseCase.create(
                userId,
                request.name(),
                request.type(),
                request.color()
        );

        return ResponseEntity
                .status(201)
                .body(ApiResponse.created("카테고리가 생성되었습니다.", CategoryResponse.from(category)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories(
            @RequestHeader("X-User-Id") UUID userId) {

        List<CategoryResponse> categories = categoryUseCase.getList(userId).stream()
                .map(CategoryResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request) {

        Category category = categoryUseCase.update(userId, id, request.name(), request.color());
        return ResponseEntity.ok(ApiResponse.success("카테고리가 수정되었습니다.", CategoryResponse.from(category)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable Long id) {

        categoryUseCase.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("카테고리가 삭제되었습니다.", null));
    }
}
