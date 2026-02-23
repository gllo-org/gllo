package com.globalledger.domain.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class AccountTest {

    private Account createAccount(BigDecimal balance, BigDecimal averageRate) {
        return new Account(1L, UUID.randomUUID(), "테스트 계좌", AccountType.CASH,
                Currency.EUR, balance, averageRate, LocalDateTime.now());
    }

    @Test
    void 최초_입금시_평단가는_입금환율로_설정된다() {
        // given
        Account account = createAccount(BigDecimal.ZERO, BigDecimal.ZERO);

        // when
        Account result = account.deposit(new BigDecimal("1000"), new BigDecimal("1300.00"));

        // then
        assertThat(result.balance()).isEqualByComparingTo(new BigDecimal("1000"));
        assertThat(result.averageRate()).isEqualByComparingTo(new BigDecimal("1300.00"));
    }

    @Test
    void 이동평균법으로_평단가가_재계산된다() {
        // given: 기존 잔액 1000 EUR, 평단가 1300원
        Account account = createAccount(new BigDecimal("1000"), new BigDecimal("1300.00"));

        // when: 500 EUR 추가 입금, 입금 환율 1350원
        Account result = account.deposit(new BigDecimal("500"), new BigDecimal("1350.00"));

        // then: (1000 * 1300 + 500 * 1350) / 1500 = 1316.666... = 1316.666667
        assertThat(result.balance()).isEqualByComparingTo(new BigDecimal("1500"));
        assertThat(result.averageRate()).isEqualByComparingTo(new BigDecimal("1316.666667"));
    }

    @Test
    void 동일_환율로_추가_입금시_평단가가_유지된다() {
        // given: 기존 잔액 1000 EUR, 평단가 1300원
        Account account = createAccount(new BigDecimal("1000"), new BigDecimal("1300.00"));

        // when: 1000 EUR 추가 입금, 동일 환율 1300원
        Account result = account.deposit(new BigDecimal("1000"), new BigDecimal("1300.00"));

        // then: 평단가 동일
        assertThat(result.balance()).isEqualByComparingTo(new BigDecimal("2000"));
        assertThat(result.averageRate()).isEqualByComparingTo(new BigDecimal("1300.000000"));
    }

    @Test
    void 출금시_잔액만_감소하고_평단가는_유지된다() {
        // given: 기존 잔액 1000 EUR, 평단가 1300원
        Account account = createAccount(new BigDecimal("1000"), new BigDecimal("1300.00"));

        // when: 400 EUR 출금
        Account result = account.withdraw(new BigDecimal("400"));

        // then: 잔액 감소, 평단가 유지
        assertThat(result.balance()).isEqualByComparingTo(new BigDecimal("600"));
        assertThat(result.averageRate()).isEqualByComparingTo(new BigDecimal("1300.00"));
    }

    @Test
    void 출금_후_재입금시_이동평균_재계산된다() {
        // given: 1000 EUR 잔액, 평단가 1300원에서 600 EUR 출금 후 잔액 400 EUR
        Account account = createAccount(new BigDecimal("400"), new BigDecimal("1300.00"));

        // when: 600 EUR 추가 입금, 환율 1400원
        Account result = account.deposit(new BigDecimal("600"), new BigDecimal("1400.00"));

        // then: (400 * 1300 + 600 * 1400) / 1000 = (520000 + 840000) / 1000 = 1360
        assertThat(result.balance()).isEqualByComparingTo(new BigDecimal("1000"));
        assertThat(result.averageRate()).isEqualByComparingTo(new BigDecimal("1360.000000"));
    }

    @Test
    void create_팩토리메서드로_생성시_초기값이_올바르다() {
        // given
        UUID userId = UUID.randomUUID();

        // when
        Account account = Account.create(userId, "EUR 계좌", AccountType.BANK,
                Currency.EUR, new BigDecimal("500"));

        // then
        assertThat(account.id()).isNull();
        assertThat(account.userId()).isEqualTo(userId);
        assertThat(account.balance()).isEqualByComparingTo(new BigDecimal("500"));
        assertThat(account.averageRate()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
