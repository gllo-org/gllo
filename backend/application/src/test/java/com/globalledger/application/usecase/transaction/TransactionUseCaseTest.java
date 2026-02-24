package com.globalledger.application.usecase.transaction;

import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.AccountType;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.model.TransactionType;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TransactionUseCaseTest {

    @Mock
    private TransactionRepositoryPort transactionRepository;

    @Mock
    private AccountRepositoryPort accountRepository;

    @Mock
    private ExchangeRateRepositoryPort exchangeRateRepository;

    @InjectMocks
    private TransactionUseCaseImpl transactionUseCase;

    private final UUID userId = UUID.randomUUID();
    private final Long accountId = 1L;
    private final Long transactionId = 10L;

    @Test
    void EXPENSE_거래_생성_시_계좌_잔액이_차감되고_거래가_저장된다() {
        // given
        Account account = new Account(accountId, userId, "KRW 계좌", AccountType.CASH,
                Currency.KRW, new BigDecimal("100000"), BigDecimal.ZERO, LocalDateTime.now());
        Transaction savedTransaction = new Transaction(transactionId, userId, accountId,
                TransactionType.EXPENSE, "식비", new BigDecimal("15000"), Currency.KRW,
                1L, null, LocalDate.now(), null, BigDecimal.ONE, null, null, LocalDateTime.now());

        given(accountRepository.findByIdAndUserId(accountId, userId)).willReturn(Optional.of(account));
        given(accountRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
        given(transactionRepository.save(any())).willReturn(savedTransaction);

        // when
        Transaction result = transactionUseCase.create(userId, accountId, TransactionType.EXPENSE, "식비",
                new BigDecimal("15000"), Currency.KRW, 1L, null, LocalDate.now(), null, null, null);

        // then
        assertThat(result.type()).isEqualTo(TransactionType.EXPENSE);
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("15000"));
        verify(accountRepository).save(any(Account.class));
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void INCOME_거래_생성_시_계좌_잔액이_증가하고_거래가_저장된다() {
        // given
        Account account = new Account(accountId, userId, "KRW 계좌", AccountType.CASH,
                Currency.KRW, new BigDecimal("50000"), BigDecimal.ZERO, LocalDateTime.now());
        Transaction savedTransaction = new Transaction(transactionId, userId, accountId,
                TransactionType.INCOME, "용돈", new BigDecimal("200000"), Currency.KRW,
                1L, null, LocalDate.now(), null, BigDecimal.ONE, null, null, LocalDateTime.now());

        given(accountRepository.findByIdAndUserId(accountId, userId)).willReturn(Optional.of(account));
        given(accountRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
        given(transactionRepository.save(any())).willReturn(savedTransaction);

        // when
        Transaction result = transactionUseCase.create(userId, accountId, TransactionType.INCOME, "용돈",
                new BigDecimal("200000"), Currency.KRW, 1L, null, LocalDate.now(), null, null, null);

        // then
        assertThat(result.type()).isEqualTo(TransactionType.INCOME);
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("200000"));
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void 존재하지_않는_계좌로_거래_생성_시_ACCOUNT_NOT_FOUND_예외가_발생한다() {
        // given
        given(accountRepository.findByIdAndUserId(accountId, userId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> transactionUseCase.create(userId, accountId, TransactionType.EXPENSE,
                "식비", new BigDecimal("10000"), Currency.KRW, null, null, LocalDate.now(), null, null, null))
                .isInstanceOf(NotFoundException.class)
                .satisfies(ex -> {
                    NotFoundException ne = (NotFoundException) ex;
                    assert ne.getErrorCode() == ErrorCode.ACCOUNT_NOT_FOUND;
                });
    }

    @Test
    void 거래_목록_조회_시_필터_조건에_맞는_거래_목록이_반환된다() {
        // given
        List<Transaction> transactions = List.of(
                new Transaction(1L, userId, accountId, TransactionType.EXPENSE, "식비",
                        new BigDecimal("15000"), Currency.KRW, 1L, null, LocalDate.now(),
                        null, BigDecimal.ONE, null, null, LocalDateTime.now()),
                new Transaction(2L, userId, accountId, TransactionType.INCOME, "용돈",
                        new BigDecimal("500000"), Currency.KRW, 2L, null, LocalDate.now(),
                        null, BigDecimal.ONE, null, null, LocalDateTime.now())
        );
        given(transactionRepository.findAllByUserIdAndFilter(userId, 2026, 2, null, null))
                .willReturn(transactions);

        // when
        List<Transaction> result = transactionUseCase.getList(userId, 2026, 2, null, null);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).type()).isEqualTo(TransactionType.EXPENSE);
        assertThat(result.get(1).type()).isEqualTo(TransactionType.INCOME);
    }

    @Test
    void 존재하지_않는_거래_조회_시_TRANSACTION_NOT_FOUND_예외가_발생한다() {
        // given
        given(transactionRepository.findByIdAndUserId(transactionId, userId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> transactionUseCase.getById(userId, transactionId))
                .isInstanceOf(NotFoundException.class)
                .satisfies(ex -> {
                    NotFoundException ne = (NotFoundException) ex;
                    assert ne.getErrorCode() == ErrorCode.TRANSACTION_NOT_FOUND;
                });
    }

    @Test
    void 거래_삭제_시_계좌_잔액이_복원되고_거래가_삭제된다() {
        // given
        Transaction transaction = new Transaction(transactionId, userId, accountId,
                TransactionType.EXPENSE, "식비", new BigDecimal("15000"), Currency.KRW,
                1L, null, LocalDate.now(), null, BigDecimal.ONE, null, null, LocalDateTime.now());
        Account account = new Account(accountId, userId, "KRW 계좌", AccountType.CASH,
                Currency.KRW, new BigDecimal("85000"), BigDecimal.ZERO, LocalDateTime.now());

        given(transactionRepository.findByIdAndUserId(transactionId, userId)).willReturn(Optional.of(transaction));
        given(accountRepository.findByIdAndUserId(accountId, userId)).willReturn(Optional.of(account));
        given(accountRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        // when
        transactionUseCase.delete(userId, transactionId);

        // then
        verify(accountRepository).save(any(Account.class));
        verify(transactionRepository).deleteById(transactionId);
    }
}
