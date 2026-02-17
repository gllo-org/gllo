package com.globalledger.application.usecase.exchange;

import com.globalledger.domain.exception.BusinessException;
import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.ExchangeRate;
import com.globalledger.domain.model.Transaction;
import com.globalledger.domain.model.TransactionType;
import com.globalledger.domain.port.input.ExchangeCurrencyPort;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.domain.port.output.ExchangeRateRepositoryPort;
import com.globalledger.domain.port.output.TransactionRepositoryPort;
import com.globalledger.shared.constants.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ExchangeCurrencyUseCaseImpl implements ExchangeCurrencyPort {

    private final AccountRepositoryPort accountRepository;
    private final ExchangeRateRepositoryPort exchangeRateRepository;
    private final TransactionRepositoryPort transactionRepository;

    @Override
    public void exchange(UUID userId, Long fromAccountId, Long toAccountId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(ErrorCode.INVALID_AMOUNT);
        }

        if (fromAccountId.equals(toAccountId)) {
            throw new BusinessException(ErrorCode.SAME_ACCOUNT_EXCHANGE);
        }

        Account fromAccount = accountRepository.findByIdAndUserId(fromAccountId, userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ACCOUNT_NOT_FOUND));

        Account toAccount = accountRepository.findByIdAndUserId(toAccountId, userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ACCOUNT_NOT_FOUND));

        if (fromAccount.balance().compareTo(amount) < 0) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        ExchangeRate rate = exchangeRateRepository.findLatestByPair(
                        fromAccount.currency(), toAccount.currency())
                .orElseThrow(() -> new BusinessException(ErrorCode.EXCHANGE_RATE_NOT_FOUND));

        BigDecimal exchangedAmount = amount.multiply(rate.rate())
                .setScale(toAccount.currency().getDecimalScale(), RoundingMode.HALF_UP);

        Account updatedFromAccount = fromAccount.withdraw(amount);
        Account updatedToAccount = toAccount.deposit(exchangedAmount, rate.rate());

        accountRepository.save(updatedFromAccount);
        accountRepository.save(updatedToAccount);

        LocalDate today = LocalDate.now();
        String note = String.format("환전: %s → %s (환율: %s)",
                fromAccount.currency(), toAccount.currency(), rate.rate());

        Transaction fromTransaction = Transaction.create(
                userId, fromAccountId, TransactionType.EXCHANGE,
                amount.negate(), fromAccount.currency(),
                null, null, today, note
        );

        Transaction toTransaction = Transaction.create(
                userId, toAccountId, TransactionType.EXCHANGE,
                exchangedAmount, toAccount.currency(),
                null, null, today, note
        );

        transactionRepository.save(fromTransaction);
        transactionRepository.save(toTransaction);

        log.info("Currency exchanged: {} {} → {} {} for user {}",
                amount, fromAccount.currency(), exchangedAmount, toAccount.currency(), userId);
    }
}
