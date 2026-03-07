package com.globalledger.application.usecase.report;

import com.globalledger.domain.model.Category;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.MonthlyBudget;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.model.TransactionType;
import com.globalledger.domain.port.input.MonthlyAnalyticsPort;
import com.globalledger.domain.port.output.CategoryRepositoryPort;
import com.globalledger.domain.port.output.MonthlyBudgetRepositoryPort;
import com.globalledger.domain.port.output.TransactionRepositoryPort;
import com.globalledger.domain.vo.MonthlyAnalytics;
import com.globalledger.domain.vo.MonthlyAnalyticsCategoryExpense;
import com.globalledger.domain.vo.MonthlyAnalyticsDailyExpense;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MonthlyAnalyticsUseCaseImpl implements MonthlyAnalyticsPort {

    private final TransactionRepositoryPort transactionRepository;
    private final MonthlyBudgetRepositoryPort budgetRepository;
    private final CategoryRepositoryPort categoryRepository;

    @Override
    public MonthlyAnalytics getMonthlyAnalytics(UUID userId, YearMonth yearMonth) {
        List<Transaction> transactions = transactionRepository.findAllByUserIdAndFilter(
                userId, yearMonth.getYear(), yearMonth.getMonthValue(), null, null);

        Currency currency = resolveCurrency(userId, yearMonth, transactions);

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.type() == TransactionType.INCOME && t.currency() == currency)
                .map(Transaction::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
                .filter(t -> t.type() == TransactionType.EXPENSE && t.currency() == currency)
                .map(Transaction::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<MonthlyAnalyticsCategoryExpense> categoryExpenses =
                buildCategoryExpenses(transactions, currency, totalExpense);

        List<MonthlyAnalyticsCategoryExpense> categoryIncomes =
                buildCategoryIncomes(transactions, currency, totalIncome);

        List<MonthlyAnalyticsDailyExpense> dailyExpenses =
                buildDailyExpenses(transactions, currency);

        String yearMonthStr = String.format("%04d-%02d", yearMonth.getYear(), yearMonth.getMonthValue());

        return new MonthlyAnalytics(yearMonthStr, totalIncome, totalExpense, currency,
                categoryExpenses, categoryIncomes, dailyExpenses);
    }

    private Currency resolveCurrency(UUID userId, YearMonth yearMonth, List<Transaction> transactions) {
        return budgetRepository.findByUserIdAndYearMonth(userId, yearMonth)
                .map(MonthlyBudget::currency)
                .orElseGet(() -> findMostCommonCurrency(transactions));
    }

    private Currency findMostCommonCurrency(List<Transaction> transactions) {
        return transactions.stream()
                .filter(t -> t.type() == TransactionType.EXPENSE || t.type() == TransactionType.INCOME)
                .collect(Collectors.groupingBy(Transaction::currency, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(Currency.KRW);
    }

    private List<MonthlyAnalyticsCategoryExpense> buildCategoryExpenses(
            List<Transaction> transactions, Currency currency, BigDecimal totalExpense) {

        Map<Long, Category> categoryCache = new HashMap<>();

        Map<Long, BigDecimal> grouped = transactions.stream()
                .filter(t -> t.type() == TransactionType.EXPENSE && t.currency() == currency)
                .collect(Collectors.groupingBy(
                        t -> t.categoryId() != null ? t.categoryId() : -1L,
                        Collectors.reducing(BigDecimal.ZERO, Transaction::amount, BigDecimal::add)
                ));

        return grouped.entrySet().stream()
                .map(e -> {
                    Long categoryId = e.getKey() == -1L ? null : e.getKey();
                    Category cat = categoryId != null
                            ? categoryCache.computeIfAbsent(categoryId,
                                    id -> categoryRepository.findById(id).orElse(null))
                            : null;
                    String name = cat != null ? cat.name() : "기타";
                    String emoji = cat != null && cat.emoji() != null ? cat.emoji() : "";
                    BigDecimal pct = totalExpense.compareTo(BigDecimal.ZERO) == 0
                            ? BigDecimal.ZERO
                            : e.getValue().multiply(BigDecimal.valueOf(100))
                                    .divide(totalExpense, 2, RoundingMode.HALF_UP);
                    return new MonthlyAnalyticsCategoryExpense(name, emoji, e.getValue(), pct);
                })
                .sorted(Comparator.comparing(MonthlyAnalyticsCategoryExpense::amount).reversed())
                .toList();
    }

    private List<MonthlyAnalyticsCategoryExpense> buildCategoryIncomes(
            List<Transaction> transactions, Currency currency, BigDecimal totalIncome) {

        Map<Long, Category> categoryCache = new HashMap<>();

        Map<Long, BigDecimal> grouped = transactions.stream()
                .filter(t -> t.type() == TransactionType.INCOME && t.currency() == currency)
                .collect(Collectors.groupingBy(
                        t -> t.categoryId() != null ? t.categoryId() : -1L,
                        Collectors.reducing(BigDecimal.ZERO, Transaction::amount, BigDecimal::add)
                ));

        return grouped.entrySet().stream()
                .map(e -> {
                    Long categoryId = e.getKey() == -1L ? null : e.getKey();
                    Category cat = categoryId != null
                            ? categoryCache.computeIfAbsent(categoryId,
                                    id -> categoryRepository.findById(id).orElse(null))
                            : null;
                    String name = cat != null ? cat.name() : "기타";
                    String emoji = cat != null && cat.emoji() != null ? cat.emoji() : "";
                    BigDecimal pct = totalIncome.compareTo(BigDecimal.ZERO) == 0
                            ? BigDecimal.ZERO
                            : e.getValue().multiply(BigDecimal.valueOf(100))
                                    .divide(totalIncome, 2, RoundingMode.HALF_UP);
                    return new MonthlyAnalyticsCategoryExpense(name, emoji, e.getValue(), pct);
                })
                .sorted(Comparator.comparing(MonthlyAnalyticsCategoryExpense::amount).reversed())
                .toList();
    }

    private List<MonthlyAnalyticsDailyExpense> buildDailyExpenses(
            List<Transaction> transactions, Currency currency) {

        return transactions.stream()
                .filter(t -> t.type() == TransactionType.EXPENSE && t.currency() == currency)
                .collect(Collectors.groupingBy(
                        Transaction::transactionDate,
                        Collectors.reducing(BigDecimal.ZERO, Transaction::amount, BigDecimal::add)
                ))
                .entrySet().stream()
                .map(e -> new MonthlyAnalyticsDailyExpense(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(MonthlyAnalyticsDailyExpense::date))
                .toList();
    }

}
