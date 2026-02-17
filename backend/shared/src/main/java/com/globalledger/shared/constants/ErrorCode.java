package com.globalledger.shared.constants;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    INVALID_INPUT(400, "잘못된 요청입니다."),
    UNAUTHORIZED(401, "인증이 필요합니다."),
    FORBIDDEN(403, "접근 권한이 없습니다."),
    INTERNAL_SERVER_ERROR(500, "서버 오류가 발생했습니다."),

    ACCOUNT_NOT_FOUND(404, "계좌를 찾을 수 없습니다."),
    ACCOUNT_HAS_TRANSACTIONS(400, "거래 내역이 있는 계좌는 삭제할 수 없습니다."),
    UNSUPPORTED_CURRENCY(400, "지원하지 않는 통화입니다."),
    INSUFFICIENT_BALANCE(400, "잔액이 부족합니다."),
    SAME_ACCOUNT_EXCHANGE(400, "동일한 계좌로는 환전할 수 없습니다."),
    INVALID_AMOUNT(400, "금액은 0보다 커야 합니다."),

    TRANSACTION_NOT_FOUND(404, "거래 내역을 찾을 수 없습니다."),

    CATEGORY_NOT_FOUND(404, "카테고리를 찾을 수 없습니다."),
    SYSTEM_CATEGORY_CANNOT_DELETE(400, "시스템 기본 카테고리는 삭제할 수 없습니다."),

    TRIP_NOT_FOUND(404, "여행 프로젝트를 찾을 수 없습니다."),

    BUDGET_NOT_FOUND(404, "예산을 찾을 수 없습니다."),
    BUDGET_ALREADY_EXISTS(400, "해당 월에 예산이 이미 존재합니다."),

    RECURRING_RULE_NOT_FOUND(404, "고정 지출 규칙을 찾을 수 없습니다."),

    EXCHANGE_RATE_NOT_FOUND(404, "환율 정보를 찾을 수 없습니다."),
    EXCHANGE_RATE_API_FAILURE(500, "환율 정보를 가져오는 데 실패했습니다.");

    private final int httpStatus;
    private final String message;
}
