package com.globalledger.domain.port.output;

import com.globalledger.domain.model.Transaction;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepositoryPort {
    Transaction save(Transaction transaction);
    Optional<Transaction> findByIdAndUserId(Long id, UUID userId);
    List<Transaction> findAllByUserIdAndFilter(UUID userId, Integer year, Integer month,
                                                Long accountId, Long categoryId);
    void deleteById(Long id);
    BigDecimal sumAmountByUserIdAndYearMonth(UUID userId, int year, int month, boolean excludeTrip);
}
