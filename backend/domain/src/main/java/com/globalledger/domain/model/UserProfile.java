package com.globalledger.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserProfile(
        Long id,
        UUID userId,
        String email,
        String displayName,
        String profileImageUrl,
        StayPurpose purpose,
        String country,
        LocalDate stayStartDate,
        LocalDate stayEndDate,
        boolean onboardingCompleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime deletedAt
) {
    public static UserProfile create(UUID userId, String email) {
        String defaultName = extractNameFromEmail(email);
        return new UserProfile(
                null,
                userId,
                email,
                defaultName,
                null,
                null,
                null,
                null,
                null,
                false,
                LocalDateTime.now(),
                LocalDateTime.now(),
                null
        );
    }

    public UserProfile updateOnboarding(StayPurpose purpose, String country,
                                        LocalDate stayStartDate, LocalDate stayEndDate) {
        return new UserProfile(
                id, userId, email, displayName, profileImageUrl,
                purpose, country, stayStartDate, stayEndDate,
                true,
                createdAt, LocalDateTime.now(), deletedAt
        );
    }

    public UserProfile updateDisplayName(String newDisplayName) {
        return new UserProfile(
                id, userId, email, newDisplayName, profileImageUrl,
                purpose, country, stayStartDate, stayEndDate, onboardingCompleted,
                createdAt, LocalDateTime.now(), deletedAt
        );
    }

    public UserProfile updateProfileImage(String imageUrl) {
        return new UserProfile(
                id, userId, email, displayName, imageUrl,
                purpose, country, stayStartDate, stayEndDate, onboardingCompleted,
                createdAt, LocalDateTime.now(), deletedAt
        );
    }

    public UserProfile removeProfileImage() {
        return new UserProfile(
                id, userId, email, displayName, null,
                purpose, country, stayStartDate, stayEndDate, onboardingCompleted,
                createdAt, LocalDateTime.now(), deletedAt
        );
    }

    public UserProfile softDelete() {
        return new UserProfile(
                id, userId, email, displayName, profileImageUrl,
                purpose, country, stayStartDate, stayEndDate, onboardingCompleted,
                createdAt, LocalDateTime.now(), LocalDateTime.now()
        );
    }

    public UserProfile restore() {
        return new UserProfile(
                id, userId, email, displayName, profileImageUrl,
                purpose, country, stayStartDate, stayEndDate, onboardingCompleted,
                createdAt, LocalDateTime.now(), null
        );
    }

    public UserProfile resetToFresh() {
        return new UserProfile(
                id, userId, email, extractNameFromEmail(email), null,
                null, null, null, null, false,
                LocalDateTime.now(), LocalDateTime.now(), null
        );
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public boolean isRestorable() {
        return deletedAt != null && deletedAt.isAfter(LocalDateTime.now().minusDays(30));
    }

    public String getInitialLetter() {
        if (email == null || email.isEmpty()) {
            return "U";
        }
        return email.substring(0, 1).toUpperCase();
    }

    private static String extractNameFromEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "User";
        }
        return email.split("@")[0];
    }
}
