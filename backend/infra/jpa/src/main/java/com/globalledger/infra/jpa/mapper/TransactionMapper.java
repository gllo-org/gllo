package com.globalledger.infra.jpa.mapper;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.model.TransactionType;
import com.globalledger.infra.jpa.entity.TransactionEntity;
import org.springframework.stereotype.Component;

@Component
public class TransactionMapper {

    public Transaction toDomain(TransactionEntity entity) {
        return new Transaction(
                entity.getId(),
                entity.getUserId(),
                entity.getAccountId(),
                TransactionType.valueOf(entity.getType()),
                entity.getAmount(),
                Currency.valueOf(entity.getCurrency()),
                entity.getCategoryId(),
                entity.getTripId(),
                entity.getTransactionDate(),
                entity.getNote(),
                entity.getCreatedAt()
        );
    }

    public TransactionEntity toEntity(Transaction domain) {
        return TransactionEntity.builder()
                .id(domain.id())
                .userId(domain.userId())
                .accountId(domain.accountId())
                .type(domain.type().name())
                .amount(domain.amount())
                .currency(domain.currency().name())
                .categoryId(domain.categoryId())
                .tripId(domain.tripId())
                .transactionDate(domain.transactionDate())
                .note(domain.note())
                .createdAt(domain.createdAt())
                .build();
    }
}
