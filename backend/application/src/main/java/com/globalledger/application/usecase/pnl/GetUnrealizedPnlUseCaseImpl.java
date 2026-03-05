package com.globalledger.application.usecase.pnl;

import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.shared.constants.ErrorCode;
import com.globalledger.domain.model.Account;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.ExchangeRate;
import com.globalledger.domain.port.input.UnrealizedPnlPort;
import com.globalledger.domain.port.output.AccountRepositoryPort;
import com.globalledger.domain.port.output.ExchangeRateRepositoryPort;
import com.globalledger.domain.vo.UnrealizedPnl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetUnrealizedPnlUseCaseImpl implements UnrealizedPnlPort {

    private final AccountRepositoryPort accountRepository;
    private final ExchangeRateRepositoryPort exchangeRateRepository;

    @Override
    public UnrealizedPnl getUnrealizedPnl(UUID userId, Long accountId, Currency baseCurrency) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ACCOUNT_NOT_FOUND));

        return calculatePnl(account, baseCurrency);
    }

    @Override
    public List<UnrealizedPnl> getAllUnrealizedPnl(UUID userId, Currency baseCurrency) {
        List<Account> accounts = accountRepository.findAllByUserId(userId);
        return accounts.stream()
                .map(account -> calculatePnl(account, baseCurrency))
                .toList();
    }

    private UnrealizedPnl calculatePnl(Account account, Currency baseCurrency) {
        if (account.currency() == baseCurrency) {
            return UnrealizedPnl.calculate(
                    account.id(), account.name(), account.currency(),
                    account.balance(), BigDecimal.ONE, BigDecimal.ONE);
        }

        BigDecimal averageRate = account.averageRate() != null
                ? account.averageRate()
                : BigDecimal.ZERO;

        BigDecimal currentRate = exchangeRateRepository
                .findLatestByPair(account.currency(), baseCurrency)
                .map(ExchangeRate::rate)
                .orElse(averageRate);

        return UnrealizedPnl.calculate(
                account.id(), account.name(), account.currency(),
                account.balance(), averageRate, currentRate);
    }
}
