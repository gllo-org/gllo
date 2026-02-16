package com.globalledger.domain.port.output;

import java.time.YearMonth;
import java.util.UUID;

public interface PdfGeneratorPort {
    byte[] generateMonthlyReport(UUID userId, YearMonth yearMonth);
}
