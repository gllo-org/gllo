package com.globalledger.domain.port.input;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.vo.DashboardStatistics;

import java.time.LocalDate;
import java.util.UUID;

public interface DashboardStatisticsPort {
    DashboardStatistics getStatistics(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate,
            Currency currency,
            boolean excludeTrip
    );
}
