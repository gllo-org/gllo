package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.port.input.AccountPort;
import com.globalledger.domain.port.input.UnrealizedPnlPort;
import com.globalledger.domain.vo.UnrealizedPnl;
import com.globalledger.inbound.web.dto.request.CreateAccountRequest;
import com.globalledger.inbound.web.dto.response.AccountResponse;
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

@Tag(name = "계좌 API")
@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountPort accountUseCase;
    private final UnrealizedPnlPort unrealizedPnlUseCase;

    @Operation(summary = "계좌 생성", description = "새로운 계좌를 생성합니다.")
    @PostMapping
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(
            Authentication authentication,
            @Valid @RequestBody CreateAccountRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
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

    @Operation(summary = "계좌 목록 조회", description = "사용자의 모든 계좌 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getAccounts(Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());
        List<Account> accounts = accountUseCase.getList(userId);

        Map<Long, UnrealizedPnl> pnlMap = unrealizedPnlUseCase.getAllUnrealizedPnl(userId, Currency.KRW)
                .stream()
                .collect(Collectors.toMap(UnrealizedPnl::accountId, p -> p));

        List<AccountResponse> responses = accounts.stream()
                .map(account -> {
                    UnrealizedPnl pnl = pnlMap.get(account.id());
                    return pnl != null ? AccountResponse.from(account, pnl) : AccountResponse.from(account);
                })
                .toList();

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @Operation(summary = "계좌 상세 조회", description = "특정 계좌의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccount(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        Account account = accountUseCase.getById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(AccountResponse.from(account)));
    }

    @Operation(summary = "계좌 삭제", description = "특정 계좌를 삭제합니다.")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        accountUseCase.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("계좌가 삭제되었습니다.", null));
    }
}
