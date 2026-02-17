package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.vo.DailyAssetTrend;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyAssetTrendResponse(
        LocalDate date,
        BigDecimal totalAsset,
        Currency currency
) {
    public static DailyAssetTrendResponse from(DailyAssetTrend trend) {
        return new DailyAssetTrendResponse(
                trend.date(),
                trend.totalAsset(),
                trend.currency()
        );
    }
}
