package com.globalledger.application.usecase.userprofile;

import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.UserProfile;
import com.globalledger.domain.port.input.UserProfilePort;
import com.globalledger.domain.port.output.UserProfileRepositoryPort;
import com.globalledger.shared.constants.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserProfileUseCaseImpl implements UserProfilePort {

    private final UserProfileRepositoryPort userProfileRepository;

    @Override
    public UserProfile getOrCreateProfile(UUID userId, String email) {
        return userProfileRepository.findByUserIdIncludeDeleted(userId)
                .map(existing -> {
                    if (!existing.isDeleted()) {
                        return existing;
                    }
                    if (existing.isRestorable()) {
                        UserProfile restored = userProfileRepository.save(existing.restore());
                        log.info("Account restored for user: {}", userId);
                        return restored;
                    }
                    UserProfile fresh = userProfileRepository.save(existing.resetToFresh());
                    log.info("Account reset to fresh for user: {}", userId);
                    return fresh;
                })
                .orElseGet(() -> {
                    UserProfile newProfile = UserProfile.create(userId, email);
                    UserProfile saved = userProfileRepository.save(newProfile);
                    log.info("Created new profile for user: {}", userId);
                    return saved;
                });
    }

    @Override
    public UserProfile updateDisplayName(UUID userId, String displayName) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_PROFILE_NOT_FOUND));

        if (displayName == null || displayName.trim().isEmpty() || displayName.length() > 50) {
            throw new IllegalArgumentException("표시 이름은 1자 이상 50자 이하여야 합니다.");
        }

        UserProfile updated = profile.updateDisplayName(displayName);
        return userProfileRepository.save(updated);
    }

    @Override
    public UserProfile updateProfileImage(UUID userId, String imageUrl) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_PROFILE_NOT_FOUND));

        UserProfile updated = profile.updateProfileImage(imageUrl);
        return userProfileRepository.save(updated);
    }

    @Override
    public UserProfile removeProfileImage(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_PROFILE_NOT_FOUND));

        UserProfile updated = profile.removeProfileImage();
        return userProfileRepository.save(updated);
    }
}
