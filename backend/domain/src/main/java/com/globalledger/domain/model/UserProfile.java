package com.globalledger.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserProfile(
        Long id,
        UUID userId,
        String email,
        String displayName,
        String profileImageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserProfile create(UUID userId, String email) {
        String defaultName = extractNameFromEmail(email);
        return new UserProfile(
                null,
                userId,
                email,
                defaultName,
                null,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    public UserProfile updateDisplayName(String newDisplayName) {
        return new UserProfile(
                id,
                userId,
                email,
                newDisplayName,
                profileImageUrl,
                createdAt,
                LocalDateTime.now()
        );
    }

    public UserProfile updateProfileImage(String imageUrl) {
        return new UserProfile(
                id,
                userId,
                email,
                displayName,
                imageUrl,
                createdAt,
                LocalDateTime.now()
        );
    }

    public UserProfile removeProfileImage() {
        return new UserProfile(
                id,
                userId,
                email,
                displayName,
                null,
                createdAt,
                LocalDateTime.now()
        );
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
