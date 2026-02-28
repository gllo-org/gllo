package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.Trip;
import com.globalledger.domain.port.input.TripPort;
import com.globalledger.inbound.web.dto.request.CreateTripRequest;
import com.globalledger.inbound.web.dto.request.UpdateTripRequest;
import com.globalledger.inbound.web.dto.response.TripResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "여행 API")
@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripPort tripUseCase;

    @Operation(summary = "여행 생성", description = "새로운 여행 프로젝트를 생성합니다.")
    @PostMapping
    public ResponseEntity<ApiResponse<TripResponse>> createTrip(
            Authentication authentication,
            @Valid @RequestBody CreateTripRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
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

    @Operation(summary = "여행 목록 조회", description = "사용자의 모든 여행 프로젝트 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<TripResponse>>> getTrips(
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());
        List<TripResponse> trips = tripUseCase.getList(userId).stream()
                .map(TripResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(trips));
    }

    @Operation(summary = "여행 상세 조회", description = "특정 여행 프로젝트의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TripResponse>> getTrip(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        Trip trip = tripUseCase.getById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(TripResponse.from(trip)));
    }

    @Operation(summary = "여행 완료", description = "여행 프로젝트를 완료 상태로 변경합니다.")
    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<TripResponse>> completeTrip(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        Trip trip = tripUseCase.complete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("여행이 완료되었습니다.", TripResponse.from(trip)));
    }

    @Operation(summary = "여행 수정", description = "여행 프로젝트의 정보를 수정합니다.")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<TripResponse>> updateTrip(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody UpdateTripRequest request) {

        UUID userId = UUID.fromString(authentication.getName());
        Trip trip = tripUseCase.update(
                userId, id,
                request.name(),
                request.startDate(),
                request.endDate(),
                request.budget(),
                request.budgetCurrency()
        );
        return ResponseEntity.ok(ApiResponse.success("여행 정보가 수정되었습니다.", TripResponse.from(trip)));
    }

    @Operation(summary = "여행 삭제", description = "여행 프로젝트를 삭제합니다.")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTrip(
            Authentication authentication,
            @PathVariable Long id) {

        UUID userId = UUID.fromString(authentication.getName());
        tripUseCase.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success("여행이 삭제되었습니다.", null));
    }
}
