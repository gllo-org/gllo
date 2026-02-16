package com.globalledger.domain.port.output;

import com.globalledger.domain.model.Trip;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripRepositoryPort {
    Trip save(Trip trip);
    Optional<Trip> findByIdAndUserId(Long id, UUID userId);
    List<Trip> findAllByUserId(UUID userId);
}
