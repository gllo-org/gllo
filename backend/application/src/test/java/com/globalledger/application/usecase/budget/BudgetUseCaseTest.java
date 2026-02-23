package com.globalledger.application.usecase.budget;

import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.MonthlyBudget;
import com.globalledger.domain.port.output.MonthlyBudgetRepositoryPort;
import com.globalledger.domain.port.output.TransactionRepositoryPort;
import com.globalledger.domain.vo.BudgetStatus;
import com.globalledger.shared.constants.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class BudgetUseCaseTest {

    @Mock
    private MonthlyBudgetRepositoryPort budgetRepository;

    @Mock
    private TransactionRepositoryPort transactionRepository;

    @InjectMocks
    private BudgetUseCaseImpl budgetUseCase;

    private final UUID userId = UUID.randomUUID();
    private final YearMonth currentMonth = YearMonth.now();

    @Test
    void 예산이_없으면_신규_예산을_생성한다() {
        // given
        BigDecimal amount = new BigDecimal("1000.00");
        MonthlyBudget expected = MonthlyBudget.create(userId, currentMonth, amount, Currency.EUR);

        given(budgetRepository.findByUserIdAndYearMonth(userId, currentMonth)).willReturn(Optional.empty());
        given(budgetRepository.save(any())).willReturn(expected);

        // when
        MonthlyBudget result = budgetUseCase.set(userId, currentMonth, amount, Currency.EUR);

        // then
        assertThat(result.amount()).isEqualByComparingTo(amount);
        assertThat(result.currency()).isEqualTo(Currency.EUR);
        verify(budgetRepository).save(any(MonthlyBudget.class));
    }

    @Test
    void 예산이_이미_존재하면_금액을_업데이트한다() {
        // given
        BigDecimal originalAmount = new BigDecimal("1000.00");
        BigDecimal updatedAmount = new BigDecimal("1500.00");
        MonthlyBudget existing = new MonthlyBudget(1L, userId, currentMonth,
                originalAmount, Currency.EUR, LocalDateTime.now());
        MonthlyBudget updated = existing.update(updatedAmount);

        given(budgetRepository.findByUserIdAndYearMonth(userId, currentMonth)).willReturn(Optional.of(existing));
        given(budgetRepository.save(any())).willReturn(updated);

        // when
        MonthlyBudget result = budgetUseCase.set(userId, currentMonth, updatedAmount, Currency.EUR);

        // then
        assertThat(result.amount()).isEqualByComparingTo(updatedAmount);
        verify(budgetRepository).save(any(MonthlyBudget.class));
    }

    @Test
    void 예산_현황_조회시_올바른_소진율이_계산된다() {
        // given
        BigDecimal budgetAmount = new BigDecimal("1000.00");
        BigDecimal spentAmount = new BigDecimal("300.00");
        MonthlyBudget budget = new MonthlyBudget(1L, userId, currentMonth,
                budgetAmount, Currency.EUR, LocalDateTime.now());

        given(budgetRepository.findByUserIdAndYearMonth(userId, currentMonth)).willReturn(Optional.of(budget));
        given(transactionRepository.sumAmountByUserIdAndYearMonth(
                userId, currentMonth.getYear(), currentMonth.getMonthValue(), true))
                .willReturn(spentAmount);

        // when
        BudgetStatus status = budgetUseCase.getStatus(userId, currentMonth);

        // then
        assertThat(status.budgetAmount()).isEqualByComparingTo(budgetAmount);
        assertThat(status.spentAmount()).isEqualByComparingTo(spentAmount);
        assertThat(status.remainingAmount()).isEqualByComparingTo(new BigDecimal("700.00"));
        assertThat(status.budgetProgressRate()).isEqualByComparingTo(new BigDecimal("30.00"));
    }

    @Test
    void 지출이_없을때_예산_현황은_0원_소진으로_계산된다() {
        // given
        BigDecimal budgetAmount = new BigDecimal("1000.00");
        MonthlyBudget budget = new MonthlyBudget(1L, userId, currentMonth,
                budgetAmount, Currency.EUR, LocalDateTime.now());

        given(budgetRepository.findByUserIdAndYearMonth(userId, currentMonth)).willReturn(Optional.of(budget));
        given(transactionRepository.sumAmountByUserIdAndYearMonth(
                userId, currentMonth.getYear(), currentMonth.getMonthValue(), true))
                .willReturn(null);

        // when
        BudgetStatus status = budgetUseCase.getStatus(userId, currentMonth);

        // then
        assertThat(status.spentAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(status.remainingAmount()).isEqualByComparingTo(budgetAmount);
        assertThat(status.budgetProgressRate()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void 예산이_설정되지_않은_월_조회시_BUDGET_NOT_FOUND_예외가_발생한다() {
        // given
        given(budgetRepository.findByUserIdAndYearMonth(userId, currentMonth)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> budgetUseCase.getStatus(userId, currentMonth))
                .isInstanceOf(NotFoundException.class)
                .satisfies(ex -> {
                    NotFoundException ne = (NotFoundException) ex;
                    assert ne.getErrorCode() == ErrorCode.BUDGET_NOT_FOUND;
                });
    }
}
