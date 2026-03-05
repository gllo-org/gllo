package com.globalledger.domain.port.input;

import com.globalledger.domain.vo.MonthlyAnalytics;

import java.time.YearMonth;
import java.util.UUID;

public interface MonthlyAnalyticsPort {
    MonthlyAnalytics getMonthlyAnalytics(UUID userId, YearMonth yearMonth);
}
