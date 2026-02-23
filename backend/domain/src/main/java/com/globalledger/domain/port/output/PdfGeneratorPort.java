package com.globalledger.domain.port.output;

import com.globalledger.domain.vo.MonthlyReportData;

import java.time.YearMonth;
import java.util.UUID;

public interface PdfGeneratorPort {
    byte[] generateMonthlyReport(UUID userId, YearMonth yearMonth);
    byte[] generateMonthlyReport(MonthlyReportData reportData);
}
