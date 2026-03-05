package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Category;
import com.globalledger.domain.port.input.CategoryPort;
import com.globalledger.inbound.web.dto.request.CreateCategoryRequest;
import com.globalledger.inbound.web.dto.request.UpdateCategoryRequest;
import com.globalledger.inbound.web.dto.response.CategoryResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "카테고리 API")
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryPort categoryUseCase;

    @Operation(summary = "카테고리 생성", description = "새로운 카테고리를 생성합니다.")
    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            Authentication authentication,
            @Valid @RequestBody CreateCategoryRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
        Category category = categoryUseCase.create(
                userId,
                request.name(),
                request.type(),
                request.color(),
                request.emoji()
        );

        return ResponseEntity
                .status(201)
                .body(ApiResponse.created("카테고리가 생성되었습니다.", CategoryResponse.from(category)));
    }

    @Operation(summary = "카테고리 목록 조회", description = "사용자의 모든 카테고리 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories(
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());
        List<CategoryResponse> categories = categoryUseCase.getList(userId).stream()
                .map(CategoryResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @Operation(summary = "카테고리 수정", description = "특정 카테고리의 정보를 수정합니다.")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
        Category category = categoryUseCase.update(userId, id, request.name(), request.color(), request.emoji());
        return ResponseEntity.ok(ApiResponse.success("카테고리가 수정되었습니다.", CategoryResponse.from(category)));
    }

    @Operation(summary = "카테고리 삭제", description = "특정 카테고리를 삭제합니다.")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        categoryUseCase.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("카테고리가 삭제되었습니다.", null));
    }
}
