package com.globalledger.infra.jpa.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "accounts",
        indexes = {
                @Index(name = "idx_accounts_user_id", columnList = "user_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class AccountEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "type", nullable = false, length = 10)
    private String type;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "balance", precision = 19, scale = 4, nullable = false)
    private BigDecimal balance;

    @Column(name = "average_rate", precision = 19, scale = 6, nullable = false)
    private BigDecimal averageRate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public void updateBalance(BigDecimal balance, BigDecimal averageRate) {
        this.balance = balance;
        this.averageRate = averageRate;
    }
}
