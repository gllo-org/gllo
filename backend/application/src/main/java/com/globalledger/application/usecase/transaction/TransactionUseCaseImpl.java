package com.globalledger.application.usecase.transaction;

import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.model.TransactionType;
import com.globalledger.domain.port.input.TransactionPort;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.domain.port.output.ExchangeRateRepositoryPort;
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
    private final ExchangeRateRepositoryPort exchangeRateRepository;

    @Override
    public Transaction create(UUID userId, Long accountId, TransactionType type, String title,
                               BigDecimal amount, Currency currency, Long categoryId,
                               Long tripId, LocalDate transactionDate, String note,
                               BigDecimal customExchangeRate, BigDecimal customConvertedAmount) {

        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ACCOUNT_NOT_FOUND));

        BigDecimal systemExchangeRate = getSystemExchangeRate(currency, transactionDate);

        Transaction transaction = Transaction.create(userId, accountId, type, title, amount, currency,
                categoryId, tripId, transactionDate, note, systemExchangeRate,
                customExchangeRate, customConvertedAmount);

        Account updatedAccount = updateAccountBalance(account, type, amount, BigDecimal.ONE);
        accountRepository.save(updatedAccount);

        return transactionRepository.save(transaction);
    }

    @Override
    public Transaction update(UUID userId, Long transactionId, String title, BigDecimal amount,
                               Long categoryId, Long tripId, LocalDate transactionDate,
                               String note, BigDecimal customExchangeRate, BigDecimal customConvertedAmount) {

        Transaction existingTransaction = getById(userId, transactionId);

        Account account = accountRepository.findByIdAndUserId(existingTransaction.accountId(), userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ACCOUNT_NOT_FOUND));

        Account restoredAccount = restoreAccountBalance(account, existingTransaction.type(), existingTransaction.amount());

        String updatedTitle = title != null ? title : existingTransaction.title();
        BigDecimal updatedAmount = amount != null ? amount : existingTransaction.amount();
        Long updatedCategoryId = categoryId != null ? categoryId : existingTransaction.categoryId();
        Long updatedTripId = tripId != null ? tripId : existingTransaction.tripId();
        LocalDate updatedDate = transactionDate != null ? transactionDate : existingTransaction.transactionDate();
        String updatedNote = note != null ? note : existingTransaction.note();
        BigDecimal updatedCustomExchangeRate = customExchangeRate != null ? customExchangeRate : existingTransaction.customExchangeRate();
        BigDecimal updatedCustomConvertedAmount = customConvertedAmount != null ? customConvertedAmount : existingTransaction.customConvertedAmount();

        BigDecimal systemExchangeRate = getSystemExchangeRate(existingTransaction.currency(), updatedDate);

        Transaction updatedTransaction = new Transaction(
                existingTransaction.id(),
                existingTransaction.userId(),
                existingTransaction.accountId(),
                existingTransaction.type(),
                updatedTitle,
                updatedAmount,
                existingTransaction.currency(),
                updatedCategoryId,
                updatedTripId,
                updatedDate,
                updatedNote,
                systemExchangeRate,
                updatedCustomExchangeRate,
                updatedCustomConvertedAmount,
                existingTransaction.createdAt()
        );

        Account newUpdatedAccount = updateAccountBalance(restoredAccount, updatedTransaction.type(), updatedAmount, BigDecimal.ONE);
        accountRepository.save(newUpdatedAccount);

        return transactionRepository.save(updatedTransaction);
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

    private BigDecimal getSystemExchangeRate(Currency currency, LocalDate transactionDate) {
        if (currency == Currency.KRW) {
            return BigDecimal.ONE;
        }

        return exchangeRateRepository.findLatestByPair(currency, Currency.KRW)
                .map(ExchangeRate::rate)
                .orElse(null);
    }
}
