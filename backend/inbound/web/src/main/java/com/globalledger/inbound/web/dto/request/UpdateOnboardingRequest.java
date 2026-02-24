package com.globalledger.inbound.web.dto.request;

import com.globalledger.domain.model.StayPurpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record UpdateOnboardingRequest(
        @NotNull StayPurpose purpose,
        @NotBlank String country,
        @NotNull LocalDate stayStartDate,
        LocalDate stayEndDate
) {
}
