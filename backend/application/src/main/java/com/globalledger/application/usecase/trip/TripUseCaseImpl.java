package com.globalledger.application.usecase.trip;

import com.globalledger.domain.exception.NotFoundException;
import com.globalledger.domain.model.Currency;
import com.globalledger.domain.model.Trip;
import com.globalledger.domain.port.input.TripPort;
import com.globalledger.domain.port.output.TripRepositoryPort;
import com.globalledger.shared.constants.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class TripUseCaseImpl implements TripPort {

    private final TripRepositoryPort tripRepository;

    @Override
    public Trip create(UUID userId, String name, LocalDate startDate,
                       LocalDate endDate, BigDecimal budget, Currency budgetCurrency) {
        Trip trip = Trip.create(userId, name, startDate, endDate, budget, budgetCurrency);
        return tripRepository.save(trip);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Trip> getList(UUID userId) {
        return tripRepository.findAllByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Trip getById(UUID userId, Long tripId) {
        return tripRepository.findByIdAndUserId(tripId, userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.TRIP_NOT_FOUND));
    }

    @Override
    public Trip complete(UUID userId, Long tripId) {
        Trip trip = getById(userId, tripId);
        Trip completedTrip = trip.complete(LocalDate.now());
        return tripRepository.save(completedTrip);
    }
}
