package com.globalledger.application.usecase.transaction;

import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.model.TransactionType;
import com.globalledger.domain.port.input.TransactionPort;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.domain.port.output.TransactionRepositoryPort;
import com.globalledger.shared.constants.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class TransactionUseCaseImpl implements TransactionPort {

    private final TransactionRepositoryPort transactionRepository;
    private final AccountRepositoryPort accountRepository;

    @Override
    public Transaction create(UUID userId, Long accountId, TransactionType type,
                               BigDecimal amount, Currency currency, Long categoryId,
                               Long tripId, LocalDate transactionDate, String note) {

        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ACCOUNT_NOT_FOUND));

        Transaction transaction = Transaction.create(userId, accountId, type, amount, currency,
                categoryId, tripId, transactionDate, note);

        Account updatedAccount = updateAccountBalance(account, type, amount, BigDecimal.ONE);
        accountRepository.save(updatedAccount);

        return transactionRepository.save(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Transaction> getList(UUID userId, Integer year, Integer month,
                                       Long accountId, Long categoryId) {
        return transactionRepository.findAllByUserIdAndFilter(userId, year, month, accountId, categoryId);
    }

    @Override
    @Transactional(readOnly = true)
    public Transaction getById(UUID userId, Long transactionId) {
        return transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.TRANSACTION_NOT_FOUND));
    }

    @Override
    public void delete(UUID userId, Long transactionId) {
        Transaction transaction = getById(userId, transactionId);

        Account account = accountRepository.findByIdAndUserId(transaction.accountId(), userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ACCOUNT_NOT_FOUND));

        Account restoredAccount = restoreAccountBalance(account, transaction.type(), transaction.amount());
        accountRepository.save(restoredAccount);

        transactionRepository.deleteById(transactionId);
    }

    private Account updateAccountBalance(Account account, TransactionType type, BigDecimal amount, BigDecimal rate) {
        return switch (type) {
            case INCOME -> account.deposit(amount, rate);
            case EXPENSE -> account.withdraw(amount);
            case TRANSFER, EXCHANGE -> account;
        };
    }

    private Account restoreAccountBalance(Account account, TransactionType type, BigDecimal amount) {
        return switch (type) {
            case INCOME -> account.withdraw(amount);
            case EXPENSE -> account.deposit(amount, BigDecimal.ONE);
            case TRANSFER, EXCHANGE -> account;
        };
    }
}
