package com.globalledger.infra.jpa.repository;

import com.globalledger.infra.jpa.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionJpaRepository extends JpaRepository<TransactionEntity, Long> {

    Optional<TransactionEntity> findByIdAndUserId(Long id, UUID userId);

    boolean existsByAccountId(Long accountId);

    @Query("SELECT t FROM TransactionEntity t WHERE t.userId = :userId " +
            "AND (:year IS NULL OR YEAR(t.transactionDate) = :year) " +
            "AND (:month IS NULL OR MONTH(t.transactionDate) = :month) " +
            "AND (:accountId IS NULL OR t.accountId = :accountId) " +
            "AND (:categoryId IS NULL OR t.categoryId = :categoryId) " +
            "ORDER BY t.transactionDate DESC")
    List<TransactionEntity> findAllWithFilters(
            @Param("userId") UUID userId,
            @Param("year") Integer year,
            @Param("month") Integer month,
            @Param("accountId") Long accountId,
            @Param("categoryId") Long categoryId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM TransactionEntity t " +
            "WHERE t.userId = :userId " +
            "AND YEAR(t.transactionDate) = :year " +
            "AND MONTH(t.transactionDate) = :month " +
            "AND t.type = 'EXPENSE' " +
            "AND t.tripId IS NULL")
    BigDecimal sumExpenseExcludeTrip(@Param("userId") UUID userId,
                                      @Param("year") int year,
                                      @Param("month") int month);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM TransactionEntity t " +
            "WHERE t.userId = :userId " +
            "AND YEAR(t.transactionDate) = :year " +
            "AND MONTH(t.transactionDate) = :month " +
            "AND t.type = 'EXPENSE'")
    BigDecimal sumExpense(@Param("userId") UUID userId,
                          @Param("year") int year,
                          @Param("month") int month);
}
