package com.globalledger.infra.jpa.repository;

import com.globalledger.infra.jpa.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryJpaRepository extends JpaRepository<CategoryEntity, Long> {
    Optional<CategoryEntity> findByIdAndUserId(Long id, UUID userId);

    @Query("SELECT c FROM CategoryEntity c WHERE c.userId = :userId OR c.systemCategory = true ORDER BY c.systemCategory DESC, c.name ASC")
    List<CategoryEntity> findAllByUserId(@Param("userId") UUID userId);

    boolean existsByUserIdAndName(UUID userId, String name);
    long countBySystemCategoryTrue();

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM CategoryEntity c WHERE (c.userId = :userId OR c.systemCategory = true) AND c.name = :name")
    boolean existsByNameForUser(@Param("userId") UUID userId, @Param("name") String name);
}
