package com.globalledger.domain.port.input;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.MonthlyBudget;
import com.globalledger.domain.vo.BudgetStatus;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;

public interface BudgetPort {
    MonthlyBudget set(UUID userId, YearMonth yearMonth, BigDecimal amount, Currency currency);
    BudgetStatus getStatus(UUID userId, YearMonth yearMonth);
}
