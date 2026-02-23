package com.globalledger.infra.outbound.supabase.dto;

public record VerifyOtpRequest(
        String email,
        String token,
        String type
) {
    public static VerifyOtpRequest magiclink(String email, String token) {
        return new VerifyOtpRequest(email, token, "magiclink");
    }
}
