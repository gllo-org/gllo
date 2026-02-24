package com.globalledger.application.usecase.account;

import com.globalledger.domain.exception.BusinessException;
import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.AccountType;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.shared.constants.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
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
class AccountUseCaseTest {

    @Mock
    private AccountRepositoryPort accountRepository;

    @InjectMocks
    private AccountUseCaseImpl accountUseCase;

    private final UUID userId = UUID.randomUUID();
    private final Long accountId = 1L;

    @Test
    void 계좌_생성_시_저장된_계좌가_반환된다() {
        // given
        Account saved = new Account(accountId, userId, "EUR 계좌", AccountType.CASH,
                Currency.EUR, new BigDecimal("500.00"), BigDecimal.ZERO, LocalDateTime.now());
        given(accountRepository.save(any())).willReturn(saved);

        // when
        Account result = accountUseCase.create(userId, "EUR 계좌", AccountType.CASH, Currency.EUR, new BigDecimal("500.00"));

        // then
        assertThat(result.id()).isEqualTo(accountId);
        assertThat(result.currency()).isEqualTo(Currency.EUR);
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void 계좌_목록_조회_시_사용자의_계좌_목록이_반환된다() {
        // given
        List<Account> accounts = List.of(
                new Account(1L, userId, "KRW 계좌", AccountType.CASH, Currency.KRW, new BigDecimal("1000000"), BigDecimal.ZERO, LocalDateTime.now()),
                new Account(2L, userId, "EUR 계좌", AccountType.CASH, Currency.EUR, new BigDecimal("500.00"), BigDecimal.ZERO, LocalDateTime.now())
        );
        given(accountRepository.findAllByUserId(userId)).willReturn(accounts);

        // when
        List<Account> result = accountUseCase.getList(userId);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).currency()).isEqualTo(Currency.KRW);
        assertThat(result.get(1).currency()).isEqualTo(Currency.EUR);
    }

    @Test
    void 계좌_단건_조회_성공() {
        // given
        Account account = new Account(accountId, userId, "KRW 계좌", AccountType.CASH,
                Currency.KRW, new BigDecimal("100000"), BigDecimal.ZERO, LocalDateTime.now());
        given(accountRepository.findByIdAndUserId(accountId, userId)).willReturn(Optional.of(account));

        // when
        Account result = accountUseCase.getById(userId, accountId);

        // then
        assertThat(result.id()).isEqualTo(accountId);
        assertThat(result.name()).isEqualTo("KRW 계좌");
    }

    @Test
    void 존재하지_않는_계좌_조회_시_ACCOUNT_NOT_FOUND_예외가_발생한다() {
        // given
        given(accountRepository.findByIdAndUserId(accountId, userId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> accountUseCase.getById(userId, accountId))
                .isInstanceOf(NotFoundException.class)
                .satisfies(ex -> {
                    NotFoundException ne = (NotFoundException) ex;
                    assert ne.getErrorCode() == ErrorCode.ACCOUNT_NOT_FOUND;
                });
    }

    @Test
    void 거래_내역이_없는_계좌는_삭제된다() {
        // given
        Account account = new Account(accountId, userId, "빈 계좌", AccountType.CASH,
                Currency.KRW, BigDecimal.ZERO, BigDecimal.ZERO, LocalDateTime.now());
        given(accountRepository.findByIdAndUserId(accountId, userId)).willReturn(Optional.of(account));
        given(accountRepository.existsTransactionsByAccountId(accountId)).willReturn(false);

        // when
        accountUseCase.delete(userId, accountId);

        // then
        verify(accountRepository).deleteById(accountId);
    }

    @Test
    void 거래_내역이_있는_계좌_삭제_시_ACCOUNT_HAS_TRANSACTIONS_예외가_발생한다() {
        // given
        Account account = new Account(accountId, userId, "거래 있는 계좌", AccountType.CASH,
                Currency.KRW, new BigDecimal("50000"), BigDecimal.ZERO, LocalDateTime.now());
        given(accountRepository.findByIdAndUserId(accountId, userId)).willReturn(Optional.of(account));
        given(accountRepository.existsTransactionsByAccountId(accountId)).willReturn(true);

        // when & then
        assertThatThrownBy(() -> accountUseCase.delete(userId, accountId))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assert be.getErrorCode() == ErrorCode.ACCOUNT_HAS_TRANSACTIONS;
                });
    }
}
