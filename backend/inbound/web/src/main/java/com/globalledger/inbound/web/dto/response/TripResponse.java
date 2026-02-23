package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.Trip;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record TripResponse(
        Long id,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal budget,
        Currency budgetCurrency,
        boolean active,
        LocalDateTime createdAt
) {
    public static TripResponse from(Trip trip) {
        return new TripResponse(
                trip.id(),
                trip.name(),
                trip.startDate(),
                trip.endDate(),
                trip.budget(),
                trip.budgetCurrency(),
                trip.active(),
                trip.createdAt()
        );
    }
}
