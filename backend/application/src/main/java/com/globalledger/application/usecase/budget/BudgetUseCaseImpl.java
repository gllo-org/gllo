package com.globalledger.application.usecase.budget;

import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.MonthlyBudget;
import com.globalledger.domain.port.input.BudgetPort;
import com.globalledger.domain.port.output.MonthlyBudgetRepositoryPort;
import com.globalledger.domain.port.output.TransactionRepositoryPort;
import com.globalledger.domain.vo.BudgetStatus;
import com.globalledger.shared.constants.ErrorCode;
import com.globalledger.shared.util.DateUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class BudgetUseCaseImpl implements BudgetPort {

    private final MonthlyBudgetRepositoryPort budgetRepository;
    private final TransactionRepositoryPort transactionRepository;

    @Override
    public MonthlyBudget set(UUID userId, YearMonth yearMonth, BigDecimal amount, Currency currency) {
        Optional<MonthlyBudget> existing = budgetRepository.findByUserIdAndYearMonth(userId, yearMonth);

        if (existing.isPresent()) {
            MonthlyBudget updatedBudget = existing.get().update(amount);
            return budgetRepository.save(updatedBudget);
        }

        MonthlyBudget newBudget = MonthlyBudget.create(userId, yearMonth, amount, currency);
        return budgetRepository.save(newBudget);
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetStatus getStatus(UUID userId, YearMonth yearMonth) {
        MonthlyBudget budget = budgetRepository.findByUserIdAndYearMonth(userId, yearMonth)
                .orElseThrow(() -> new NotFoundException(ErrorCode.BUDGET_NOT_FOUND));

        BigDecimal spentAmount = transactionRepository.sumAmountByUserIdAndYearMonth(
                userId, yearMonth.getYear(), yearMonth.getMonthValue(), true);

        if (spentAmount == null) {
            spentAmount = BigDecimal.ZERO;
        }

        BigDecimal remainingAmount = budget.amount().subtract(spentAmount);
        BigDecimal timeProgressRate = DateUtils.calculateTimeProgressRate(yearMonth);
        BigDecimal budgetProgressRate = calculateBudgetProgressRate(spentAmount, budget.amount());
        long daysRemaining = DateUtils.daysRemaining(yearMonth);
        BigDecimal recommendedDailyAmount = calculateRecommendedDailyAmount(remainingAmount, daysRemaining);

        return new BudgetStatus(
                budget.amount(),
                budget.currency(),
                spentAmount,
                remainingAmount,
                timeProgressRate,
                budgetProgressRate,
                recommendedDailyAmount,
                daysRemaining
        );
    }

    private BigDecimal calculateBudgetProgressRate(BigDecimal spent, BigDecimal budget) {
        if (budget.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return spent.multiply(BigDecimal.valueOf(100))
                .divide(budget, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateRecommendedDailyAmount(BigDecimal remaining, long daysRemaining) {
        if (daysRemaining <= 0) {
            return BigDecimal.ZERO;
        }
        return remaining.divide(BigDecimal.valueOf(daysRemaining), 2, RoundingMode.HALF_UP);
    }
}
