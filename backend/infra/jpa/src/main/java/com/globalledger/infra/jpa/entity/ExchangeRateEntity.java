package com.globalledger.infra.jpa.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "exchange_rates",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_exchange_rate_pair_date",
                        columnNames = {"base_currency", "target_currency", "rate_date"})
        },
        indexes = {
                @Index(name = "idx_exchange_rates_pair", columnList = "base_currency, target_currency"),
                @Index(name = "idx_exchange_rates_date", columnList = "rate_date")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ExchangeRateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "base_currency", nullable = false, length = 3)
    private String baseCurrency;

    @Column(name = "target_currency", nullable = false, length = 3)
    private String targetCurrency;

    @Column(name = "rate", precision = 19, scale = 6, nullable = false)
    private BigDecimal rate;

    @Column(name = "rate_date", nullable = false)
    private LocalDate rateDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
