package com.globalledger.shared.response;

import com.globalledger.shared.constants.ErrorCode;
import lombok.Getter;

@Getter
public class ApiResponse<T> {

    private final int code;
    private final boolean success;
    private final String message;
    private final T data;
    private final ErrorDetail error;

    private ApiResponse(int code, boolean success, String message, T data, ErrorDetail error) {
        this.code = code;
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, true, "요청이 성공했습니다.", data, null);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(200, true, message, data, null);
    }

    public static <T> ApiResponse<T> created(String message, T data) {
        return new ApiResponse<>(201, true, message, data, null);
    }

    public static <T> ApiResponse<T> error(ErrorCode errorCode, Object details) {
        ErrorDetail errorDetail = new ErrorDetail(errorCode.name(), details);
        return new ApiResponse<>(errorCode.getHttpStatus(), false, errorCode.getMessage(), null, errorDetail);
    }

    public static <T> ApiResponse<T> error(ErrorCode errorCode) {
        ErrorDetail errorDetail = new ErrorDetail(errorCode.name(), null);
        return new ApiResponse<>(errorCode.getHttpStatus(), false, errorCode.getMessage(), null, errorDetail);
    }

    @Getter
    public static class ErrorDetail {
        private final String errorCode;
        private final Object details;

        public ErrorDetail(String errorCode, Object details) {
            this.errorCode = errorCode;
            this.details = details;
        }
    }
}
