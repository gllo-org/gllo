package com.globalledger.domain.port.output;

import com.globalledger.domain.model.Account;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepositoryPort {
    Account save(Account account);
    Optional<Account> findByIdAndUserId(Long id, UUID userId);
    List<Account> findAllByUserId(UUID userId);
    void deleteById(Long id);
    boolean existsTransactionsByAccountId(Long accountId);
}
