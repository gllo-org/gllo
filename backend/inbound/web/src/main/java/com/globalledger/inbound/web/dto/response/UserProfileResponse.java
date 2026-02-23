package com.globalledger.inbound.web.dto.response;

import com.globalledger.domain.model.UserProfile;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserProfileResponse(
        UUID userId,
        String email,
        String displayName,
        String profileImageUrl,
        String initialLetter,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserProfileResponse from(UserProfile profile) {
        return new UserProfileResponse(
                profile.userId(),
                profile.email(),
                profile.displayName(),
                profile.profileImageUrl(),
                profile.getInitialLetter(),
                profile.createdAt(),
                profile.updatedAt()
        );
    }
}
