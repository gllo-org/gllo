package com.globalledger.application.usecase.account;

import com.globalledger.domain.exception.BusinessException;
import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.AccountType;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.port.input.AccountPort;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.shared.constants.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class AccountUseCaseImpl implements AccountPort {

    private final AccountRepositoryPort accountRepository;

    @Override
    public Account create(UUID userId, String name, AccountType type, Currency currency, BigDecimal initialBalance) {
        Account account = Account.create(userId, name, type, currency, initialBalance);
        return accountRepository.save(account);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Account> getList(UUID userId) {
        return accountRepository.findAllByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Account getById(UUID userId, Long accountId) {
        return accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ACCOUNT_NOT_FOUND));
    }

    @Override
    public void delete(UUID userId, Long accountId) {
        Account account = getById(userId, accountId);

        if (accountRepository.existsTransactionsByAccountId(accountId)) {
            throw new BusinessException(ErrorCode.ACCOUNT_HAS_TRANSACTIONS);
        }

        accountRepository.deleteById(account.id());
    }
}
