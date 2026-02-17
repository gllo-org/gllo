package com.globalledger.application.usecase.report;

import com.globalledger.domain.model.*;
import com.globalledger.domain.port.input.GeneratePdfReportPort;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.domain.port.output.ExchangeRateRepositoryPort;
import com.globalledger.domain.port.output.MonthlyBudgetRepositoryPort;
import com.globalledger.domain.port.output.TransactionRepositoryPort;
import com.globalledger.domain.vo.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GeneratePdfReportUseCaseImpl implements GeneratePdfReportPort {

    private final AccountRepositoryPort accountRepository;
    private final TransactionRepositoryPort transactionRepository;
    private final MonthlyBudgetRepositoryPort budgetRepository;
    private final ExchangeRateRepositoryPort exchangeRateRepository;

    @Override
    public byte[] generateMonthlyReport(UUID userId, YearMonth yearMonth) {
        throw new UnsupportedOperationException("PDF generation should be handled by PdfGeneratorPort implementation");
    }

    @Override
    public MonthlyReportData getMonthlyReportData(UUID userId, YearMonth yearMonth) {
        List<Account> accounts = accountRepository.findAllByUserId(userId);

        List<AccountSummary> accountSummaries = new ArrayList<>();
        BigDecimal totalAssetsKrw = BigDecimal.ZERO;

        LocalDate rateDate = yearMonth.atEndOfMonth();

        for (Account account : accounts) {
            BigDecimal currentRate = getCurrentRate(account.currency(), rateDate);

            AccountSummary summary = AccountSummary.of(
                    account.id(),
                    account.name(),
                    account.currency(),
                    account.balance(),
                    account.averageRate() != null ? account.averageRate() : BigDecimal.ZERO,
                    currentRate
            );

            accountSummaries.add(summary);

            if (account.currency() != Currency.KRW) {
                totalAssetsKrw = totalAssetsKrw.add(account.balance().multiply(currentRate));
            } else {
                totalAssetsKrw = totalAssetsKrw.add(account.balance());
            }
        }

        List<Transaction> transactions = transactionRepository.findAllByUserIdAndFilter(
                userId,
                yearMonth.getYear(),
                yearMonth.getMonthValue(),
                null,
                null
        );

        List<TransactionSummary> transactionSummaries = transactions.stream()
                .map(tx -> new TransactionSummary(
                        tx.transactionDate(),
                        tx.type(),
                        tx.amount(),
                        tx.currency(),
                        tx.categoryId() != null ? tx.categoryId().toString() : "-",
                        tx.note()
                ))
                .toList();

        ReportBudgetSummary budgetSummary = getBudgetSummary(userId, yearMonth);

        return new MonthlyReportData(
                userId.toString(),
                yearMonth,
                accountSummaries,
                totalAssetsKrw,
                transactionSummaries,
                budgetSummary
        );
    }

    private BigDecimal getCurrentRate(Currency currency, LocalDate date) {
        if (currency == Currency.KRW) {
            return BigDecimal.ONE;
        }

        return exchangeRateRepository.findLatestByPair(Currency.KRW, currency)
                .map(ExchangeRate::rate)
                .orElse(BigDecimal.ONE);
    }

    private ReportBudgetSummary getBudgetSummary(UUID userId, YearMonth yearMonth) {
        return budgetRepository.findByUserIdAndYearMonth(userId, yearMonth)
                .map(budget -> {
                    BigDecimal spent = transactionRepository.sumAmountByUserIdAndYearMonth(
                            userId,
                            yearMonth.getYear(),
                            yearMonth.getMonthValue(),
                            true
                    );

                    return ReportBudgetSummary.of(
                            budget.currency(),
                            budget.amount(),
                            spent != null ? spent : BigDecimal.ZERO
                    );
                })
                .orElse(null);
    }
}
