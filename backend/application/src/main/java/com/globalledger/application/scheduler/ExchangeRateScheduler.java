package com.globalledger.application.scheduler;

import com.globalledger.domain.port.input.ExchangeRatePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateScheduler {

    private final ExchangeRatePort exchangeRatePort;

    @Scheduled(cron = "0 0 1 * * *")
    public void updateExchangeRates() {
        log.info("Scheduled exchange rate update started");
        exchangeRatePort.updateRates();
        log.info("Scheduled exchange rate update completed");
    }
}
