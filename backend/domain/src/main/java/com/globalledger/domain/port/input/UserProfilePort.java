package com.globalledger.domain.port.input;

import com.globalledger.domain.model.StayPurpose;
import com.globalledger.domain.model.UserProfile;

import java.time.LocalDate;
import java.util.UUID;

public interface UserProfilePort {
    UserProfile getOrCreateProfile(UUID userId, String email);
    UserProfile updateOnboarding(UUID userId, StayPurpose purpose, String country,
                                 LocalDate stayStartDate, LocalDate stayEndDate);
    UserProfile updateDisplayName(UUID userId, String displayName);
    UserProfile updateProfileImage(UUID userId, String imageUrl);
    UserProfile removeProfileImage(UUID userId);
}
