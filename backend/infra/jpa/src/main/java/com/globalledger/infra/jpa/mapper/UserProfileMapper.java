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
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public UserProfileEntity toEntity(UserProfile domain) {
        return new UserProfileEntity(
                domain.id(),
                domain.userId(),
                domain.email(),
                domain.displayName(),
                domain.profileImageUrl(),
                domain.createdAt(),
                domain.updatedAt()
        );
    }
}
