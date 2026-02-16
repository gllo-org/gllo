package com.globalledger.infra.jpa.repository;

import com.globalledger.infra.jpa.entity.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountJpaRepository extends JpaRepository<AccountEntity, Long> {
    Optional<AccountEntity> findByIdAndUserId(Long id, UUID userId);
    List<AccountEntity> findAllByUserId(UUID userId);
}
