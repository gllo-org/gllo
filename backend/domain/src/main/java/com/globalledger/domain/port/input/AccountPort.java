package com.globalledger.domain.port.input;

import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.AccountType;
import com.globalledger.domain.model.Currency;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface AccountPort {
    Account create(UUID userId, String name, AccountType type, Currency currency, BigDecimal initialBalance);
    List<Account> getList(UUID userId);
    Account getById(UUID userId, Long accountId);
    void delete(UUID userId, Long accountId);
}
