package com.globalledger.domain.port.output;

import com.globalledger.domain.model.UserProfile;

import java.util.Optional;
import java.util.UUID;

public interface UserProfileRepositoryPort {
    Optional<UserProfile> findByUserId(UUID userId);
    UserProfile save(UserProfile userProfile);
    void deleteByUserId(UUID userId);
}
