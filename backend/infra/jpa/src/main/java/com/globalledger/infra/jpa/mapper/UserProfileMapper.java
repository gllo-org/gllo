package com.globalledger.infra.jpa.mapper;

import com.globalledger.domain.model.UserProfile;
import com.globalledger.infra.jpa.entity.UserProfileEntity;
import org.springframework.stereotype.Component;

@Component
public class UserProfileMapper {

    public UserProfile toDomain(UserProfileEntity entity) {
        return new UserProfile(
                entity.getId(),
                entity.getUserId(),
                entity.getEmail(),
                entity.getDisplayName(),
                entity.getProfileImageUrl(),
                entity.getPurpose(),
                entity.getCountry(),
                entity.getStayStartDate(),
                entity.getStayEndDate(),
                entity.isOnboardingCompleted(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getDeletedAt()
        );
    }

    public UserProfileEntity toEntity(UserProfile domain) {
        return new UserProfileEntity(
                domain.id(),
                domain.userId(),
                domain.email(),
                domain.displayName(),
                domain.profileImageUrl(),
                domain.purpose(),
                domain.country(),
                domain.stayStartDate(),
                domain.stayEndDate(),
                domain.onboardingCompleted(),
                domain.createdAt(),
                domain.updatedAt(),
                domain.deletedAt()
        );
    }
}
