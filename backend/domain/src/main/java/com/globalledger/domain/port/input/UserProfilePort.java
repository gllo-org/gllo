package com.globalledger.domain.port.input;

import com.globalledger.domain.model.UserProfile;

import java.util.UUID;

public interface UserProfilePort {
    UserProfile getOrCreateProfile(UUID userId, String email);
    UserProfile updateDisplayName(UUID userId, String displayName);
    UserProfile updateProfileImage(UUID userId, String imageUrl);
    UserProfile removeProfileImage(UUID userId);
}
