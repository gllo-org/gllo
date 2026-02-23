package com.globalledger.application.usecase.dashboard;

import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.model.TransactionType;
import com.globalledger.domain.port.input.DashboardStatisticsPort;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.domain.port.output.CategoryRepositoryPort;
import com.globalledger.domain.port.output.TransactionRepositoryPort;
import com.globalledger.domain.vo.CategorySpending;
import com.globalledger.domain.vo.DailyAssetTrend;
import com.globalledger.domain.vo.DashboardStatistics;
import com.globalledger.domain.vo.MonthlyComparison;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DashboardStatisticsUseCaseImpl implements DashboardStatisticsPort {

    private final TransactionRepositoryPort transactionRepository;
    private final AccountRepositoryPort accountRepository;
    private final CategoryRepositoryPort categoryRepository;

    @Override
    public DashboardStatistics getStatistics(UUID userId, LocalDate startDate, LocalDate endDate,
                                              Currency currency, boolean excludeTrip) {
        List<CategorySpending> categorySpendingList = calculateCategorySpending(userId, startDate, endDate, currency, excludeTrip);
        List<DailyAssetTrend> dailyAssetTrends = calculateDailyAssetTrends(userId, endDate, currency);
        List<MonthlyComparison> monthlyComparisons = calculateMonthlyComparisons(userId, startDate, endDate, currency);

        return new DashboardStatistics(categorySpendingList, dailyAssetTrends, monthlyComparisons);
    }

    private List<CategorySpending> calculateCategorySpending(UUID userId, LocalDate startDate,
                                                              LocalDate endDate, Currency currency,
                                                              boolean excludeTrip) {
        List<Transaction> transactions = transactionRepository.findAllByUserIdAndFilter(
                userId, null, null, null, null);

        Map<String, BigDecimal> categorySpendingMap = transactions.stream()
                .filter(t -> t.type() == TransactionType.EXPENSE)
                .filter(t -> !startDate.isAfter(t.transactionDate()) && !endDate.isBefore(t.transactionDate()))
                .filter(t -> !excludeTrip || t.tripId() == null)
                .filter(t -> t.currency() == currency)
                .collect(Collectors.groupingBy(
                        t -> getCategoryName(t.categoryId()),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::amount, BigDecimal::add)
                ));

        BigDecimal totalAmount = categorySpendingMap.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return categorySpendingMap.entrySet().stream()
                .map(entry -> CategorySpending.of(entry.getKey(), entry.getValue(), currency, totalAmount))
                .sorted(Comparator.comparing(CategorySpending::amount).reversed())
                .collect(Collectors.toList());
    }

    private List<DailyAssetTrend> calculateDailyAssetTrends(UUID userId, LocalDate asOfDate, Currency currency) {
        List<Account> accounts = accountRepository.findAllByUserId(userId);

        BigDecimal totalAsset = accounts.stream()
                .filter(account -> account.currency() == currency)
                .map(Account::balance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return List.of(new DailyAssetTrend(asOfDate, totalAsset, currency));
    }

    private List<MonthlyComparison> calculateMonthlyComparisons(UUID userId, LocalDate startDate,
                                                                 LocalDate endDate, Currency currency) {
        YearMonth startMonth = YearMonth.from(startDate);
        YearMonth endMonth = YearMonth.from(endDate);

        List<MonthlyComparison> comparisons = new ArrayList<>();

        for (YearMonth month = startMonth; !month.isAfter(endMonth); month = month.plusMonths(1)) {
            List<Transaction> monthlyTransactions = transactionRepository.findAllByUserIdAndFilter(
                    userId, month.getYear(), month.getMonthValue(), null, null);

            BigDecimal income = monthlyTransactions.stream()
                    .filter(t -> t.type() == TransactionType.INCOME)
                    .filter(t -> t.currency() == currency)
                    .map(Transaction::amount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal expense = monthlyTransactions.stream()
                    .filter(t -> t.type() == TransactionType.EXPENSE)
                    .filter(t -> t.currency() == currency)
                    .map(Transaction::amount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            comparisons.add(new MonthlyComparison(month, income, expense, currency));
        }

        return comparisons;
    }

    private String getCategoryName(Long categoryId) {
        if (categoryId == null) {
            return "기타";
        }
        return categoryRepository.findById(categoryId)
                .map(category -> category.name())
                .orElse("기타");
    }
}
