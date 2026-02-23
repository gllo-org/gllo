package com.globalledger.shared.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

class DateUtilsTest {

    @Test
    void 과거_월_조회시_시간진행률은_100이다() {
        // given
        YearMonth pastMonth = YearMonth.now().minusMonths(1);

        // when
        BigDecimal rate = DateUtils.calculateTimeProgressRate(pastMonth);

        // then
        assertThat(rate).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void 미래_월_조회시_시간진행률은_0이다() {
        // given
        YearMonth futureMonth = YearMonth.now().plusMonths(1);

        // when
        BigDecimal rate = DateUtils.calculateTimeProgressRate(futureMonth);

        // then
        assertThat(rate).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void 현재_월_시간진행률은_0보다_크고_100이하다() {
        // given
        YearMonth currentMonth = YearMonth.now();

        // when
        BigDecimal rate = DateUtils.calculateTimeProgressRate(currentMonth);

        // then
        assertThat(rate).isGreaterThan(BigDecimal.ZERO);
        assertThat(rate).isLessThanOrEqualTo(BigDecimal.valueOf(100));
    }

    @Test
    void 과거_월_조회시_잔여일수는_0이다() {
        // given
        YearMonth pastMonth = YearMonth.now().minusMonths(1);

        // when
        long daysRemaining = DateUtils.daysRemaining(pastMonth);

        // then
        assertThat(daysRemaining).isZero();
    }

    @Test
    void 미래_월_조회시_잔여일수는_오늘부터_해당_월_말일까지의_일수이다() {
        // given
        YearMonth futureMonth = YearMonth.now().plusMonths(1);
        long expected = ChronoUnit.DAYS.between(LocalDate.now(), futureMonth.atEndOfMonth());

        // when
        long daysRemaining = DateUtils.daysRemaining(futureMonth);

        // then
        assertThat(daysRemaining).isEqualTo(expected);
    }

    @Test
    void 과거_월_경과일수는_해당_월의_전체_일수이다() {
        // given
        YearMonth pastMonth = YearMonth.now().minusMonths(1);

        // when
        long daysElapsed = DateUtils.daysElapsed(pastMonth);

        // then
        assertThat(daysElapsed).isEqualTo(pastMonth.lengthOfMonth());
    }

    @Test
    void 미래_월_경과일수는_0이다() {
        // given
        YearMonth futureMonth = YearMonth.now().plusMonths(1);

        // when
        long daysElapsed = DateUtils.daysElapsed(futureMonth);

        // then
        assertThat(daysElapsed).isZero();
    }
}
