package com.globalledger.application.usecase.exchange;

import com.globalledger.domain.exception.BusinessException;
import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.AccountType;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.domain.port.output.ExchangeRateRepositoryPort;
import com.globalledger.domain.port.output.TransactionRepositoryPort;
import com.globalledger.shared.constants.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExchangeCurrencyUseCaseTest {

    @Mock
    private AccountRepositoryPort accountRepository;

    @Mock
    private ExchangeRateRepositoryPort exchangeRateRepository;

    @Mock
    private TransactionRepositoryPort transactionRepository;

    @InjectMocks
    private ExchangeCurrencyUseCaseImpl exchangeCurrencyUseCase;

    private final UUID userId = UUID.randomUUID();
    private final Long fromAccountId = 1L;
    private final Long toAccountId = 2L;

    @Test
    void 정상적인_환전_요청시_계좌잔액이_갱신되고_거래내역이_저장된다() {
        // given
        Account fromAccount = new Account(fromAccountId, userId, "KRW 계좌", AccountType.CASH,
                Currency.KRW, new BigDecimal("1300000"), BigDecimal.ZERO, LocalDateTime.now());
        Account toAccount = new Account(toAccountId, userId, "EUR 계좌", AccountType.CASH,
                Currency.EUR, BigDecimal.ZERO, BigDecimal.ZERO, LocalDateTime.now());
        ExchangeRate rate = ExchangeRate.create(Currency.KRW, Currency.EUR,
                new BigDecimal("0.00077"), LocalDate.now());

        given(accountRepository.findByIdAndUserId(fromAccountId, userId)).willReturn(Optional.of(fromAccount));
        given(accountRepository.findByIdAndUserId(toAccountId, userId)).willReturn(Optional.of(toAccount));
        given(exchangeRateRepository.findLatestByPair(Currency.KRW, Currency.EUR)).willReturn(Optional.of(rate));
        given(accountRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
        given(transactionRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        // when
        exchangeCurrencyUseCase.exchange(userId, fromAccountId, toAccountId, new BigDecimal("1000000"));

        // then
        verify(accountRepository, times(2)).save(any(Account.class));
        verify(transactionRepository, times(2)).save(any());
    }

    @Test
    void 환전금액이_0이하이면_INVALID_AMOUNT_예외가_발생한다() {
        // given
        BigDecimal invalidAmount = BigDecimal.ZERO;

        // when & then
        assertThatThrownBy(() ->
                exchangeCurrencyUseCase.exchange(userId, fromAccountId, toAccountId, invalidAmount))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assert be.getErrorCode() == ErrorCode.INVALID_AMOUNT;
                });
    }

    @Test
    void 출금계좌와_입금계좌가_동일하면_SAME_ACCOUNT_EXCHANGE_예외가_발생한다() {
        // given & when & then
        assertThatThrownBy(() ->
                exchangeCurrencyUseCase.exchange(userId, fromAccountId, fromAccountId, new BigDecimal("100")))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assert be.getErrorCode() == ErrorCode.SAME_ACCOUNT_EXCHANGE;
                });
    }

    @Test
    void 잔액이_부족하면_INSUFFICIENT_BALANCE_예외가_발생한다() {
        // given
        Account fromAccount = new Account(fromAccountId, userId, "KRW 계좌", AccountType.CASH,
                Currency.KRW, new BigDecimal("500"), BigDecimal.ZERO, LocalDateTime.now());
        Account toAccount = new Account(toAccountId, userId, "EUR 계좌", AccountType.CASH,
                Currency.EUR, BigDecimal.ZERO, BigDecimal.ZERO, LocalDateTime.now());

        given(accountRepository.findByIdAndUserId(fromAccountId, userId)).willReturn(Optional.of(fromAccount));
        given(accountRepository.findByIdAndUserId(toAccountId, userId)).willReturn(Optional.of(toAccount));

        // when & then
        assertThatThrownBy(() ->
                exchangeCurrencyUseCase.exchange(userId, fromAccountId, toAccountId, new BigDecimal("1000")))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assert be.getErrorCode() == ErrorCode.INSUFFICIENT_BALANCE;
                });
    }

    @Test
    void 계좌가_없으면_ACCOUNT_NOT_FOUND_예외가_발생한다() {
        // given
        given(accountRepository.findByIdAndUserId(fromAccountId, userId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() ->
                exchangeCurrencyUseCase.exchange(userId, fromAccountId, toAccountId, new BigDecimal("100")))
                .isInstanceOf(NotFoundException.class)
                .satisfies(ex -> {
                    NotFoundException ne = (NotFoundException) ex;
                    assert ne.getErrorCode() == ErrorCode.ACCOUNT_NOT_FOUND;
                });
    }

    @Test
    void 환율정보가_없으면_EXCHANGE_RATE_NOT_FOUND_예외가_발생한다() {
        // given
        Account fromAccount = new Account(fromAccountId, userId, "KRW 계좌", AccountType.CASH,
                Currency.KRW, new BigDecimal("1000000"), BigDecimal.ZERO, LocalDateTime.now());
        Account toAccount = new Account(toAccountId, userId, "EUR 계좌", AccountType.CASH,
                Currency.EUR, BigDecimal.ZERO, BigDecimal.ZERO, LocalDateTime.now());

        given(accountRepository.findByIdAndUserId(fromAccountId, userId)).willReturn(Optional.of(fromAccount));
        given(accountRepository.findByIdAndUserId(toAccountId, userId)).willReturn(Optional.of(toAccount));
        given(exchangeRateRepository.findLatestByPair(any(), any())).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() ->
                exchangeCurrencyUseCase.exchange(userId, fromAccountId, toAccountId, new BigDecimal("100")))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException be = (BusinessException) ex;
                    assert be.getErrorCode() == ErrorCode.EXCHANGE_RATE_NOT_FOUND;
                });
    }
}
