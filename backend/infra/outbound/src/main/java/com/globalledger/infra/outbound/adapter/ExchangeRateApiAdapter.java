package com.globalledger.infra.outbound.adapter;

import com.globalledger.domain.model.Currency;
import com.globalledger.domain.port.output.ExchangeRateApiPort;
import com.globalledger.domain.vo.ExchangeRateInfo;
import com.globalledger.infra.outbound.dto.ExchangeRateApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateApiAdapter implements ExchangeRateApiPort {

    private final RestTemplate restTemplate;

    @Value("${exchange-rate-api.url}")
    private String apiUrl;

    @Value("${exchange-rate-api.api-key}")
    private String apiKey;

    @Override
    public List<ExchangeRateInfo> fetchLatestRates(Currency baseCurrency) {
        String url = String.format("%s/%s/latest/%s", apiUrl, apiKey, baseCurrency.name());

        log.info("Fetching exchange rates for base currency: {}", baseCurrency);

        ExchangeRateApiResponse response = restTemplate.getForObject(url, ExchangeRateApiResponse.class);

        if (response == null || !"success".equals(response.result())) {
            log.error("Failed to fetch exchange rates. Response: {}", response);
            return List.of();
        }

        LocalDate rateDate = Instant.ofEpochSecond(response.timeLastUpdateUnix())
                .atZone(ZoneId.systemDefault())
                .toLocalDate();

        List<ExchangeRateInfo> rateInfos = new ArrayList<>();
        Map<String, BigDecimal> rates = response.conversionRates();

        for (Currency targetCurrency : Currency.values()) {
            if (targetCurrency == baseCurrency) {
                continue;
            }

            BigDecimal rate = rates.get(targetCurrency.name());
            if (rate != null) {
                rateInfos.add(new ExchangeRateInfo(
                        baseCurrency,
                        targetCurrency,
                        rate,
                        rateDate
                ));
            }
        }

        log.info("Fetched {} exchange rates for {}", rateInfos.size(), baseCurrency);
        return rateInfos;
    }
}
