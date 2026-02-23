package com.globalledger.domain.vo;

import java.util.List;

public record DashboardStatistics(
        List<CategorySpending> categorySpendingList,
        List<DailyAssetTrend> dailyAssetTrends,
        List<MonthlyComparison> monthlyComparisons
) {
}
