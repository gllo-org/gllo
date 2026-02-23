package com.globalledger.infra.jpa.adapter;

import com.globalledger.domain.model.UserProfile;
import com.globalledger.domain.port.output.UserProfileRepositoryPort;
import com.globalledger.infra.jpa.entity.UserProfileEntity;
import com.globalledger.infra.jpa.mapper.UserProfileMapper;
import com.globalledger.infra.jpa.repository.UserProfileJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserProfileRepositoryAdapter implements UserProfileRepositoryPort {

    private final UserProfileJpaRepository jpaRepository;
    private final UserProfileMapper mapper;

    @Override
    public Optional<UserProfile> findByUserId(UUID userId) {
        return jpaRepository.findByUserIdAndDeletedAtIsNull(userId)
                .map(mapper::toDomain);
    }

    @Override
    public Optional<UserProfile> findByUserIdIncludeDeleted(UUID userId) {
        return jpaRepository.findByUserId(userId)
                .map(mapper::toDomain);
    }

    @Override
    public UserProfile save(UserProfile userProfile) {
        UserProfileEntity entity = mapper.toEntity(userProfile);
        UserProfileEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public void deleteByUserId(UUID userId) {
        jpaRepository.deleteByUserId(userId);
    }
}
