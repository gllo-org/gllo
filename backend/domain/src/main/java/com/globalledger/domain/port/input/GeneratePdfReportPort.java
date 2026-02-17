package com.globalledger.domain.port.input;

import com.globalledger.domain.vo.MonthlyReportData;

import java.time.YearMonth;
import java.util.UUID;

public interface GeneratePdfReportPort {
    byte[] generateMonthlyReport(UUID userId, YearMonth yearMonth);
    MonthlyReportData getMonthlyReportData(UUID userId, YearMonth yearMonth);
}
