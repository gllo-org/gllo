package com.globalledger.domain.vo;

import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyAssetTrend(
        LocalDate date,
        BigDecimal totalAsset,
        Currency currency
) {
}
