package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Account;
import com.globalledger.domain.port.input.AccountPort;
import com.globalledger.inbound.web.dto.request.CreateAccountRequest;
import com.globalledger.inbound.web.dto.response.AccountResponse;
import com.globalledger.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountPort accountUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CreateAccountRequest request) {

        Account account = accountUseCase.create(
                userId,
                request.name(),
                request.type(),
                request.currency(),
                request.initialBalance()
        );

        return ResponseEntity
                .status(201)
                .body(ApiResponse.created("계좌가 생성되었습니다.", AccountResponse.from(account)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getAccounts(
            @RequestHeader("X-User-Id") UUID userId) {

        List<AccountResponse> accounts = accountUseCase.getList(userId).stream()
                .map(AccountResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccount(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable Long id) {

        Account account = accountUseCase.getById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(AccountResponse.from(account)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable Long id) {

        accountUseCase.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("계좌가 삭제되었습니다.", null));
    }
}
