package com.globalledger.infra.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.math.BigInteger;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.util.Base64;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class JwtTokenProvider {

    private static final Pattern X_PATTERN = Pattern.compile("\"x\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern Y_PATTERN = Pattern.compile("\"y\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern CRV_PATTERN = Pattern.compile("\"crv\"\\s*:\\s*\"([^\"]+)\"");

    private final SecretKey hmacKey;
    private final String supabaseUrl;

    private volatile PublicKey cachedEcKey;

    public JwtTokenProvider(
            @Value("${supabase.jwt.secret}") String jwtSecret,
            @Value("${supabase.url}") String supabaseUrl) {
        this.hmacKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.supabaseUrl = supabaseUrl;
    }

    public UUID validateTokenAndGetUserId(String token) {
        try {
            Claims claims = isEs256(token) ? verifyEs256(token) : verifyHs256(token);
            return UUID.fromString(claims.getSubject());
        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return null;
        }
    }

    public boolean validateToken(String token) {
        return validateTokenAndGetUserId(token) != null;
    }

    private boolean isEs256(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return false;
            String header = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            return header.contains("\"ES256\"");
        } catch (Exception e) {
            return false;
        }
    }

    private Claims verifyHs256(String token) {
        return Jwts.parser()
                .verifyWith(hmacKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Claims verifyEs256(String token) throws Exception {
        PublicKey key = resolveEcKey();
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private PublicKey resolveEcKey() throws Exception {
        if (cachedEcKey != null) return cachedEcKey;
        synchronized (this) {
            if (cachedEcKey != null) return cachedEcKey;
            cachedEcKey = fetchEcKeyFromJwks();
            return cachedEcKey;
        }
    }

    private PublicKey fetchEcKeyFromJwks() throws Exception {
        String jwksUrl = supabaseUrl + "/auth/v1/.well-known/jwks.json";
        HttpURLConnection conn = (HttpURLConnection) new URL(jwksUrl).openConnection();
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);
        String body = new String(conn.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        log.info("Fetched JWKS from Supabase for ES256 verification");
        return parseEcKeyFromJwksBody(body);
    }

    private PublicKey parseEcKeyFromJwksBody(String jwksJson) throws Exception {
        String[] keyBlocks = jwksJson.split("\\{");
        for (String block : keyBlocks) {
            Matcher crvMatcher = CRV_PATTERN.matcher(block);
            if (!crvMatcher.find() || !"P-256".equals(crvMatcher.group(1))) continue;

            Matcher xMatcher = X_PATTERN.matcher(block);
            Matcher yMatcher = Y_PATTERN.matcher(block);
            if (!xMatcher.find() || !yMatcher.find()) continue;

            byte[] x = Base64.getUrlDecoder().decode(xMatcher.group(1));
            byte[] y = Base64.getUrlDecoder().decode(yMatcher.group(1));

            AlgorithmParameters params = AlgorithmParameters.getInstance("EC");
            params.init(new ECGenParameterSpec("secp256r1"));
            ECParameterSpec spec = params.getParameterSpec(ECParameterSpec.class);
            ECPublicKeySpec pubSpec = new ECPublicKeySpec(
                    new ECPoint(new BigInteger(1, x), new BigInteger(1, y)), spec);
            return KeyFactory.getInstance("EC").generatePublic(pubSpec);
        }
        throw new IllegalStateException("No EC P-256 key found in Supabase JWKS");
    }
}
