package com.globalledger.inbound.web.dto.request;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateTripRequest(
        String name,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal budget,
        Currency budgetCurrency
) {
}
