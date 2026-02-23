package com.globalledger.domain.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Currency {
    EUR(2),
    USD(2),
    GBP(2),
    KRW(0);

    private final int decimalScale;
}
