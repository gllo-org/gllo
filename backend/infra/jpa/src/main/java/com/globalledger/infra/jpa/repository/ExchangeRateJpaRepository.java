package com.globalledger.infra.jpa.repository;

import com.globalledger.infra.jpa.entity.ExchangeRateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExchangeRateJpaRepository extends JpaRepository<ExchangeRateEntity, Long> {

    @Query("SELECT e FROM ExchangeRateEntity e WHERE e.baseCurrency = :base AND e.targetCurrency = :target ORDER BY e.rateDate DESC LIMIT 1")
    Optional<ExchangeRateEntity> findLatestByPair(@Param("base") String baseCurrency,
                                                   @Param("target") String targetCurrency);

    @Query("SELECT e FROM ExchangeRateEntity e WHERE e.rateDate = (SELECT MAX(e2.rateDate) FROM ExchangeRateEntity e2)")
    List<ExchangeRateEntity> findLatestAll();

    List<ExchangeRateEntity> findAllByRateDate(LocalDate rateDate);

    @Query("SELECT e FROM ExchangeRateEntity e WHERE e.baseCurrency = :base AND e.targetCurrency = :target AND e.rateDate >= :fromDate AND e.rateDate <= :toDate ORDER BY e.rateDate ASC")
    List<ExchangeRateEntity> findByPairAndDateRange(@Param("base") String baseCurrency,
                                                      @Param("target") String targetCurrency,
                                                      @Param("fromDate") LocalDate fromDate,
                                                      @Param("toDate") LocalDate toDate);
}
