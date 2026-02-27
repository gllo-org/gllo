package com.globalledger.application.scheduler;

import com.globalledger.domain.port.input.ExchangeRatePort;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateScheduler {

    private final ExchangeRatePort exchangeRatePort;

    @PostConstruct
    public void initExchangeRates() {
        if (exchangeRatePort.getLatest().isEmpty()) {
            log.info("환율 데이터 없음. 초기 로딩 시작...");
            exchangeRatePort.updateRates();
        }
    }

    @Scheduled(cron = "0 0 1 * * *")
    public void updateExchangeRates() {
        log.info("Scheduled exchange rate update started");
        exchangeRatePort.updateRates();
        log.info("Scheduled exchange rate update completed");
    }
}
