package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Trip;
import com.globalledger.domain.port.input.TripPort;
import com.globalledger.inbound.web.dto.request.CreateTripRequest;
import com.globalledger.inbound.web.dto.response.TripResponse;
import com.globalledger.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripPort tripUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<TripResponse>> createTrip(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CreateTripRequest request) {

        Trip trip = tripUseCase.create(
                userId,
                request.name(),
                request.startDate(),
                request.endDate(),
                request.budget(),
                request.budgetCurrency()
        );

        return ResponseEntity
                .status(201)
                .body(ApiResponse.created("여행 프로젝트가 생성되었습니다.", TripResponse.from(trip)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TripResponse>>> getTrips(
            @RequestHeader("X-User-Id") UUID userId) {

        List<TripResponse> trips = tripUseCase.getList(userId).stream()
                .map(TripResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(trips));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TripResponse>> getTrip(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable Long id) {

        Trip trip = tripUseCase.getById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(TripResponse.from(trip)));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<TripResponse>> completeTrip(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable Long id) {

        Trip trip = tripUseCase.complete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("여행이 완료되었습니다.", TripResponse.from(trip)));
    }
}
