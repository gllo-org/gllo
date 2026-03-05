package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Category;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.port.input.CategoryPort;
import com.globalledger.domain.port.input.TransactionPort;
import com.globalledger.inbound.web.dto.request.CreateTransactionRequest;
import com.globalledger.inbound.web.dto.request.UpdateTransactionRequest;
import com.globalledger.inbound.web.dto.response.TransactionPageResponse;
import com.globalledger.inbound.web.dto.response.TransactionResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Tag(name = "거래 API")
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionPort transactionUseCase;
    private final CategoryPort categoryUseCase;

    @Operation(summary = "거래 생성", description = "새로운 거래를 생성합니다.")
    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(
            Authentication authentication,
            @Valid @RequestBody CreateTransactionRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
        Transaction transaction = transactionUseCase.create(
                userId,
                request.accountId(),
                request.type(),
                request.title(),
                request.amount(),
                request.currency(),
                request.categoryId(),
                request.tripId(),
                request.transactionDate(),
                request.note(),
                request.customExchangeRate(),
                request.customConvertedAmount()
        );

        Map<Long, String> categoryNameMap = buildCategoryNameMap(userId);
        return ResponseEntity
                .status(201)
                .body(ApiResponse.created("거래가 생성되었습니다.",
                        TransactionResponse.from(transaction, categoryNameMap.get(transaction.categoryId()))));
    }

    @Operation(summary = "거래 목록 조회", description = "조건에 따라 거래 목록을 페이지 단위로 조회합니다.")
    @GetMapping
    public ResponseEntity<ApiResponse<TransactionPageResponse>> getTransactions(
            Authentication authentication,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID userId = UUID.fromString(authentication.getName());
        Map<Long, String> categoryNameMap = buildCategoryNameMap(userId);
        var pageResult = transactionUseCase.getPage(userId, year, month, accountId, categoryId, page, size);
        var response = new TransactionPageResponse(
                pageResult.content().stream()
                        .map(tx -> TransactionResponse.from(tx, categoryNameMap.get(tx.categoryId())))
                        .toList(),
                pageResult.hasNext(),
                pageResult.page()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "거래 상세 조회", description = "특정 거래의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        Transaction transaction = transactionUseCase.getById(userId, id);
        Map<Long, String> categoryNameMap = buildCategoryNameMap(userId);
        return ResponseEntity.ok(ApiResponse.success(
                TransactionResponse.from(transaction, categoryNameMap.get(transaction.categoryId()))));
    }

    @Operation(summary = "거래 수정", description = "특정 거래의 정보를 부분 수정합니다. 수정하고 싶은 필드만 전송하면 됩니다.")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> updateTransaction(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateTransactionRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
        Transaction transaction = transactionUseCase.update(
                userId,
                id,
                request.title(),
                request.amount(),
                request.categoryId(),
                request.tripId(),
                request.transactionDate(),
                request.note(),
                request.customExchangeRate(),
                request.customConvertedAmount()
        );

        Map<Long, String> categoryNameMap = buildCategoryNameMap(userId);
        return ResponseEntity.ok(ApiResponse.success("거래가 수정되었습니다.",
                TransactionResponse.from(transaction, categoryNameMap.get(transaction.categoryId()))));
    }

    @Operation(summary = "거래 삭제", description = "특정 거래를 삭제합니다.")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        transactionUseCase.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("거래가 삭제되었습니다.", null));
    }

    private Map<Long, String> buildCategoryNameMap(UUID userId) {
        List<Category> categories = categoryUseCase.getList(userId);
        return categories.stream()
                .collect(Collectors.toMap(Category::id, Category::name));
    }
}
