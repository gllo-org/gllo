package com.globalledger.infra.jpa.adapter;

import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.port.output.TransactionRepositoryPort;
import com.globalledger.infra.jpa.mapper.TransactionMapper;
import com.globalledger.infra.jpa.repository.TransactionJpaRepository;
import com.globalledger.shared.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class TransactionRepositoryAdapter implements TransactionRepositoryPort {

    private final TransactionJpaRepository transactionJpaRepository;
    private final TransactionMapper transactionMapper;

    @Override
    public Transaction save(Transaction transaction) {
        return transactionMapper.toDomain(transactionJpaRepository.save(transactionMapper.toEntity(transaction)));
    }

    @Override
    public Optional<Transaction> findByIdAndUserId(Long id, UUID userId) {
        return transactionJpaRepository.findByIdAndUserId(id, userId).map(transactionMapper::toDomain);
    }

    @Override
    public List<Transaction> findAllByUserIdAndFilter(UUID userId, Integer year, Integer month,
                                                       Long accountId, Long categoryId) {
        return transactionJpaRepository.findAllWithFilters(userId, year, month, accountId, categoryId)
                .stream()
                .map(transactionMapper::toDomain)
                .toList();
    }

    @Override
    public PageResult<Transaction> findPageByUserIdAndFilter(UUID userId, Integer year, Integer month,
                                                              Long accountId, Long categoryId,
                                                              int page, int size) {
        Page<Transaction> result = transactionJpaRepository
                .findPageWithFilters(userId, year, month, accountId, categoryId, PageRequest.of(page, size))
                .map(transactionMapper::toDomain);
        return new PageResult<>(result.getContent(), result.hasNext(), result.getNumber());
    }

    @Override
    public void deleteById(Long id) {
        transactionJpaRepository.deleteById(id);
    }

    @Override
    public BigDecimal sumAmountByUserIdAndYearMonth(UUID userId, int year, int month, boolean excludeTrip) {
        if (excludeTrip) {
            return transactionJpaRepository.sumExpenseExcludeTrip(userId, year, month);
        }
        return transactionJpaRepository.sumExpense(userId, year, month);
    }
}
