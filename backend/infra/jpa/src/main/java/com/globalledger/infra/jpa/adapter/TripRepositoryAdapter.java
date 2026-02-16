package com.globalledger.infra.jpa.adapter;

import com.globalledger.domain.model.Trip;
import com.globalledger.domain.port.output.TripRepositoryPort;
import com.globalledger.infra.jpa.mapper.TripMapper;
import com.globalledger.infra.jpa.repository.TripJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class TripRepositoryAdapter implements TripRepositoryPort {

    private final TripJpaRepository tripJpaRepository;
    private final TripMapper tripMapper;

    @Override
    public Trip save(Trip trip) {
        return tripMapper.toDomain(tripJpaRepository.save(tripMapper.toEntity(trip)));
    }

    @Override
    public Optional<Trip> findByIdAndUserId(Long id, UUID userId) {
        return tripJpaRepository.findByIdAndUserId(id, userId).map(tripMapper::toDomain);
    }

    @Override
    public List<Trip> findAllByUserId(UUID userId) {
        return tripJpaRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(tripMapper::toDomain)
                .toList();
    }
}
