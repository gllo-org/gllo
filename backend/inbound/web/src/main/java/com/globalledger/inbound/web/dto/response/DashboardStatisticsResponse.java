package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.vo.DashboardStatistics;

import java.util.List;
import java.util.stream.Collectors;

public record DashboardStatisticsResponse(
        List<CategorySpendingResponse> categorySpendingList,
        List<DailyAssetTrendResponse> dailyAssetTrends,
        List<MonthlyComparisonResponse> monthlyComparisons
) {
    public static DashboardStatisticsResponse from(DashboardStatistics statistics) {
        return new DashboardStatisticsResponse(
                statistics.categorySpendingList().stream()
                        .map(CategorySpendingResponse::from)
                        .collect(Collectors.toList()),
                statistics.dailyAssetTrends().stream()
                        .map(DailyAssetTrendResponse::from)
                        .collect(Collectors.toList()),
                statistics.monthlyComparisons().stream()
                        .map(MonthlyComparisonResponse::from)
                        .collect(Collectors.toList())
        );
    }
}
