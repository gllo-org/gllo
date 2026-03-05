package com.globalledger.application.usecase.dashboard;

import com.globalledger.domain.model.*;
import com.globalledger.domain.port.input.DashboardHomePort;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.domain.port.output.ExchangeRateRepositoryPort;
import com.globalledger.domain.port.output.MonthlyBudgetRepositoryPort;
import com.globalledger.domain.port.output.TransactionRepositoryPort;
import com.globalledger.domain.vo.DashboardHome;
import com.globalledger.shared.util.DateUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DashboardHomeUseCaseImpl implements DashboardHomePort {

    private final AccountRepositoryPort accountRepository;
    private final TransactionRepositoryPort transactionRepository;
    private final ExchangeRateRepositoryPort exchangeRateRepository;
    private final MonthlyBudgetRepositoryPort budgetRepository;

    @Override
    public DashboardHome getDashboardHome(UUID userId) {
        YearMonth currentMonth = YearMonth.now();
        List<Account> accounts = accountRepository.findAllByUserId(userId);

        Map<Currency, BigDecimal> toKrwRateMap = buildToKrwRateMap();
        BigDecimal totalAssetKrw = calculateTotalAssetKrw(accounts, toKrwRateMap);

        Optional<MonthlyBudget> budgetOpt = budgetRepository.findByUserIdAndYearMonth(userId, currentMonth);
        Currency currency = budgetOpt.map(MonthlyBudget::currency).orElse(Currency.KRW);

        List<Transaction> monthlyTransactions = transactionRepository.findAllByUserIdAndFilter(
                userId, currentMonth.getYear(), currentMonth.getMonthValue(), null, null);

        BigDecimal monthlyIncome = monthlyTransactions.stream()
                .filter(t -> t.type() == TransactionType.INCOME && t.currency() == currency)
                .map(Transaction::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthlyExpense = monthlyTransactions.stream()
                .filter(t -> t.type() == TransactionType.EXPENSE && t.currency() == currency)
                .map(Transaction::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (budgetOpt.isEmpty()) {
            return new DashboardHome(totalAssetKrw, monthlyIncome, monthlyExpense,
                    null, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null, currency);
        }

        MonthlyBudget budget = budgetOpt.get();
        BigDecimal budgetSpentRate = budget.amount().compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : monthlyExpense.multiply(BigDecimal.valueOf(100))
                        .divide(budget.amount(), 2, RoundingMode.HALF_UP);

        BigDecimal timeProgressRate = DateUtils.calculateTimeProgressRate(currentMonth);
        long daysRemaining = DateUtils.daysRemaining(currentMonth);
        BigDecimal dailyRecommended = daysRemaining <= 0
                ? BigDecimal.ZERO
                : budget.amount().subtract(monthlyExpense)
                        .divide(BigDecimal.valueOf(daysRemaining), 2, RoundingMode.HALF_UP);

        return new DashboardHome(totalAssetKrw, monthlyIncome, monthlyExpense,
                budget.amount(), monthlyExpense, budgetSpentRate, timeProgressRate, dailyRecommended, currency);
    }

    private Map<Currency, BigDecimal> buildToKrwRateMap() {
        return exchangeRateRepository.findLatestAll().stream()
                .filter(r -> r.targetCurrency() == Currency.KRW)
                .collect(Collectors.toMap(ExchangeRate::baseCurrency, ExchangeRate::rate, (a, b) -> a));
    }

    private BigDecimal calculateTotalAssetKrw(List<Account> accounts, Map<Currency, BigDecimal> toKrwRateMap) {
        return accounts.stream()
                .map(account -> {
                    if (account.currency() == Currency.KRW) {
                        return account.balance();
                    }
                    BigDecimal rate = toKrwRateMap.getOrDefault(account.currency(), BigDecimal.ZERO);
                    return account.balance().multiply(rate).setScale(0, RoundingMode.HALF_UP);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
