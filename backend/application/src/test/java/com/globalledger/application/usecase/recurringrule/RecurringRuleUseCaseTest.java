package com.globalledger.application.usecase.recurringrule;

import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.AccountType;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;
import com.globalledger.domain.model.RecurringFrequency;
import com.globalledger.domain.model.RecurringRule;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.model.TransactionType;
import com.globalledger.domain.port.input.TransactionPort;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.domain.port.output.ExchangeRateRepositoryPort;
import com.globalledger.domain.port.output.RecurringRuleRepositoryPort;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RecurringRuleUseCaseTest {

    @Mock
    private RecurringRuleRepositoryPort recurringRuleRepository;

    @Mock
    private TransactionPort transactionPort;

    @InjectMocks
    private RecurringRuleUseCaseImpl recurringRuleUseCase;

    private final UUID userId = UUID.randomUUID();
    private final Long ruleId = 1L;
    private final Long accountId = 10L;

    private RecurringRule buildRule(Long id, boolean active) {
        return new RecurringRule(id, userId, "월세", "월세 납부", TransactionType.EXPENSE,
                new BigDecimal("500000"), Currency.KRW, accountId, 1L,
                RecurringFrequency.MONTHLY, 1, LocalDate.now().minusMonths(1), null,
                LocalDate.now().plusDays(1), active, null, null, LocalDateTime.now());
    }

    @Test
    void 고정_지출_규칙_생성_시_저장된_규칙이_반환된다() {
        // given
        RecurringRule saved = buildRule(ruleId, true);
        given(recurringRuleRepository.save(any())).willReturn(saved);

        // when
        RecurringRule result = recurringRuleUseCase.create(userId, "월세", "월세 납부",
                TransactionType.EXPENSE, new BigDecimal("500000"), Currency.KRW,
                accountId, 1L, RecurringFrequency.MONTHLY, 1,
                LocalDate.now().minusMonths(1), null, null, null);

        // then
        assertThat(result.name()).isEqualTo("월세");
        assertThat(result.active()).isTrue();
        verify(recurringRuleRepository).save(any(RecurringRule.class));
    }

    @Test
    void 규칙_즉시_실행_시_거래가_생성된다() {
        // given
        RecurringRule rule = buildRule(ruleId, true);
        Transaction createdTransaction = new Transaction(100L, userId, accountId,
                TransactionType.EXPENSE, "월세 납부", new BigDecimal("500000"), Currency.KRW,
                1L, null, LocalDate.now(), "고정 지출/수익: 월세", BigDecimal.ONE, null, null, LocalDateTime.now());

        given(recurringRuleRepository.findByIdAndUserId(ruleId, userId)).willReturn(Optional.of(rule));
        given(transactionPort.create(eq(userId), eq(accountId), eq(TransactionType.EXPENSE),
                eq("월세 납부"), eq(new BigDecimal("500000")), eq(Currency.KRW),
                eq(1L), isNull(), any(LocalDate.class), any(), isNull(), isNull()))
                .willReturn(createdTransaction);

        // when
        Transaction result = recurringRuleUseCase.executeNow(userId, ruleId);

        // then
        assertThat(result.title()).isEqualTo("월세 납부");
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("500000"));
    }

    @Test
    void 존재하지_않는_규칙_즉시_실행_시_RECURRING_RULE_NOT_FOUND_예외가_발생한다() {
        // given
        given(recurringRuleRepository.findByIdAndUserId(ruleId, userId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> recurringRuleUseCase.executeNow(userId, ruleId))
                .isInstanceOf(NotFoundException.class)
                .satisfies(ex -> {
                    NotFoundException ne = (NotFoundException) ex;
                    assert ne.getErrorCode() == ErrorCode.RECURRING_RULE_NOT_FOUND;
                });
    }

    @Test
    void 활성_규칙_토글_시_비활성으로_변경된다() {
        // given
        RecurringRule activeRule = buildRule(ruleId, true);
        RecurringRule inactiveRule = buildRule(ruleId, false);

        given(recurringRuleRepository.findByIdAndUserId(ruleId, userId)).willReturn(Optional.of(activeRule));
        given(recurringRuleRepository.save(any())).willReturn(inactiveRule);

        // when
        RecurringRule result = recurringRuleUseCase.toggle(userId, ruleId);

        // then
        assertThat(result.active()).isFalse();
        verify(recurringRuleRepository).save(any(RecurringRule.class));
    }

    @Test
    void 비활성_규칙_토글_시_활성으로_변경된다() {
        // given
        RecurringRule inactiveRule = buildRule(ruleId, false);
        RecurringRule activeRule = buildRule(ruleId, true);

        given(recurringRuleRepository.findByIdAndUserId(ruleId, userId)).willReturn(Optional.of(inactiveRule));
        given(recurringRuleRepository.save(any())).willReturn(activeRule);

        // when
        RecurringRule result = recurringRuleUseCase.toggle(userId, ruleId);

        // then
        assertThat(result.active()).isTrue();
    }

    @Test
    void 일괄_실행_시_복수_규칙의_거래가_생성된다() {
        // given
        Long ruleId2 = 2L;
        RecurringRule rule1 = buildRule(ruleId, true);
        RecurringRule rule2 = buildRule(ruleId2, true);

        Transaction tx1 = new Transaction(101L, userId, accountId, TransactionType.EXPENSE,
                "월세 납부", new BigDecimal("500000"), Currency.KRW, 1L, null,
                LocalDate.now(), "고정 지출/수익: 월세", BigDecimal.ONE, null, null, LocalDateTime.now());
        Transaction tx2 = new Transaction(102L, userId, accountId, TransactionType.EXPENSE,
                "월세 납부", new BigDecimal("500000"), Currency.KRW, 1L, null,
                LocalDate.now(), "고정 지출/수익: 월세", BigDecimal.ONE, null, null, LocalDateTime.now());

        given(recurringRuleRepository.findByIdAndUserId(ruleId, userId)).willReturn(Optional.of(rule1));
        given(recurringRuleRepository.findByIdAndUserId(ruleId2, userId)).willReturn(Optional.of(rule2));
        given(transactionPort.create(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .willReturn(tx1)
                .willReturn(tx2);

        // when
        List<Transaction> result = recurringRuleUseCase.executeBatch(userId, List.of(ruleId, ruleId2));

        // then
        assertThat(result).hasSize(2);
    }
}
