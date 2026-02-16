package com.globalledger.infra.jpa.mapper;

import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.AccountType;
import com.globalledger.domain.model.Currency;
import com.globalledger.infra.jpa.entity.AccountEntity;
import org.springframework.stereotype.Component;

@Component
public class AccountMapper {

    public Account toDomain(AccountEntity entity) {
        return new Account(
                entity.getId(),
                entity.getUserId(),
                entity.getName(),
                AccountType.valueOf(entity.getType()),
                Currency.valueOf(entity.getCurrency()),
                entity.getBalance(),
                entity.getAverageRate(),
                entity.getCreatedAt()
        );
    }

    public AccountEntity toEntity(Account domain) {
        return AccountEntity.builder()
                .id(domain.id())
                .userId(domain.userId())
                .name(domain.name())
                .type(domain.type().name())
                .currency(domain.currency().name())
                .balance(domain.balance())
                .averageRate(domain.averageRate())
                .createdAt(domain.createdAt())
                .build();
    }
}
