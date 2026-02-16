package com.globalledger.infra.jpa.entity;

import com.globalledger.infra.jpa.converter.YearMonthConverter;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.UUID;

@Entity
@Table(
        name = "monthly_budgets",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_budget_user_yearmonth", columnNames = {"user_id", "year_month"})
        },
        indexes = {
                @Index(name = "idx_budgets_user_id", columnList = "user_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class MonthlyBudgetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Convert(converter = YearMonthConverter.class)
    @Column(name = "year_month", nullable = false, length = 7)
    private YearMonth yearMonth;

    @Column(name = "amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public void updateAmount(BigDecimal newAmount) {
        this.amount = newAmount;
    }
}
