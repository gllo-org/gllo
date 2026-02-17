package com.globalledger.infra.outbound.supabase;

import com.globalledger.domain.port.output.AuthServicePort;
import com.globalledger.domain.vo.AuthSession;
import com.globalledger.infra.outbound.supabase.dto.AuthResponse;
import com.globalledger.infra.outbound.supabase.dto.OtpRequest;
import com.globalledger.infra.outbound.supabase.dto.VerifyOtpRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SupabaseAuthAdapter implements AuthServicePort {

    private final RestTemplate restTemplate;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String anonKey;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @Override
    public void sendOtp(String email) {
        String url = supabaseUrl + "/auth/v1/otp";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", anonKey);

        OtpRequest request = new OtpRequest(email);
        HttpEntity<OtpRequest> entity = new HttpEntity<>(request, headers);

        restTemplate.postForEntity(url, entity, Void.class);
        log.info("OTP sent to email: {}", email);
    }

    @Override
    public AuthSession verifyOtp(String email, String token) {
        String url = supabaseUrl + "/auth/v1/verify";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", anonKey);

        VerifyOtpRequest request = VerifyOtpRequest.magiclink(email, token);
        HttpEntity<VerifyOtpRequest> entity = new HttpEntity<>(request, headers);

        AuthResponse response = restTemplate.postForObject(url, entity, AuthResponse.class);

        if (response == null || response.user() == null) {
            throw new IllegalArgumentException("OTP verification failed");
        }

        log.info("OTP verified for user: {}", response.user().email());

        return new AuthSession(
                UUID.fromString(response.user().id()),
                response.accessToken(),
                response.refreshToken(),
                response.expiresIn()
        );
    }

    @Override
    public void deleteUser(UUID userId, String accessToken) {
        String url = supabaseUrl + "/auth/v1/admin/users/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", serviceRoleKey);
        headers.set("Authorization", "Bearer " + serviceRoleKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);
        log.info("User deleted: {}", userId);
    }
}
