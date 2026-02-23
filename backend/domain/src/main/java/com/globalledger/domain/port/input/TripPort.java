package com.globalledger.domain.port.input;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.Trip;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TripPort {
    Trip create(UUID userId, String name, LocalDate startDate,
                LocalDate endDate, BigDecimal budget, Currency budgetCurrency);
    List<Trip> getList(UUID userId);
    Trip getById(UUID userId, Long tripId);
    Trip complete(UUID userId, Long tripId);
}
