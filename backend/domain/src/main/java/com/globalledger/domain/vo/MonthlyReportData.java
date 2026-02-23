package com.globalledger.domain.vo;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

public record MonthlyReportData(
        String userId,
        YearMonth period,
        List<AccountSummary> accounts,
        BigDecimal totalAssetsKrw,
        List<TransactionSummary> transactions,
        ReportBudgetSummary budgetSummary
) {
}
