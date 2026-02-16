package com.globalledger.infra.jpa.adapter;

import com.globalledger.domain.model.Account;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.infra.jpa.mapper.AccountMapper;
import com.globalledger.infra.jpa.repository.AccountJpaRepository;
import com.globalledger.infra.jpa.repository.TransactionJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class AccountRepositoryAdapter implements AccountRepositoryPort {

    private final AccountJpaRepository accountJpaRepository;
    private final TransactionJpaRepository transactionJpaRepository;
    private final AccountMapper accountMapper;

    @Override
    public Account save(Account account) {
        return accountMapper.toDomain(accountJpaRepository.save(accountMapper.toEntity(account)));
    }

    @Override
    public Optional<Account> findByIdAndUserId(Long id, UUID userId) {
        return accountJpaRepository.findByIdAndUserId(id, userId).map(accountMapper::toDomain);
    }

    @Override
    public List<Account> findAllByUserId(UUID userId) {
        return accountJpaRepository.findAllByUserId(userId).stream()
                .map(accountMapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(Long id) {
        accountJpaRepository.deleteById(id);
    }

    @Override
    public boolean existsTransactionsByAccountId(Long accountId) {
        return transactionJpaRepository.existsByAccountId(accountId);
    }
}
