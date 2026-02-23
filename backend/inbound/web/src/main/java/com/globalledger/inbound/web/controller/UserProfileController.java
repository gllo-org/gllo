package com.globalledger.inbound.web.controller;

import com.globalledger.domain.model.UserProfile;
import com.globalledger.domain.port.input.UserProfilePort;
import com.globalledger.inbound.web.dto.request.UpdateDisplayNameRequest;
import com.globalledger.inbound.web.dto.request.UpdateProfileImageRequest;
import com.globalledger.inbound.web.dto.response.UserProfileResponse;
import com.globalledger.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "사용자 프로필 API")
@RestController
@RequestMapping("/api/v1/user/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfilePort userProfilePort;

    @Operation(summary = "내 프로필 조회", description = "현재 로그인한 사용자의 프로필을 조회합니다. 프로필이 없으면 자동으로 생성합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        String email = authentication.getDetails().toString();
        UserProfile profile = userProfilePort.getOrCreateProfile(userId, email);
        return ResponseEntity.ok(ApiResponse.success(UserProfileResponse.from(profile)));
    }

    @Operation(summary = "표시 이름 수정", description = "사용자의 표시 이름을 수정합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "수정 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "유효성 검증 실패"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "프로필 없음")
    })
    @PutMapping("/name")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateDisplayName(
            Authentication authentication,
            @Valid @RequestBody UpdateDisplayNameRequest request
    ) {
        UUID userId = UUID.fromString(authentication.getName());
        UserProfile updated = userProfilePort.updateDisplayName(userId, request.displayName());
        return ResponseEntity.ok(ApiResponse.success("표시 이름이 수정되었습니다.", UserProfileResponse.from(updated)));
    }

    @Operation(summary = "프로필 이미지 업로드", description = "프로필 이미지 URL을 저장합니다. 이미지 파일은 클라이언트에서 Supabase Storage에 업로드 후 반환된 URL을 전달하세요.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "업로드 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "유효성 검증 실패"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "프로필 없음")
    })
    @PutMapping("/image")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfileImage(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileImageRequest request
    ) {
        UUID userId = UUID.fromString(authentication.getName());
        UserProfile updated = userProfilePort.updateProfileImage(userId, request.imageUrl());
        return ResponseEntity.ok(ApiResponse.success("프로필 이미지가 업로드되었습니다.", UserProfileResponse.from(updated)));
    }

    @Operation(summary = "프로필 이미지 삭제", description = "사용자의 프로필 이미지를 삭제합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "삭제 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "프로필 없음")
    })
    @DeleteMapping("/image")
    public ResponseEntity<ApiResponse<UserProfileResponse>> removeProfileImage(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        UserProfile updated = userProfilePort.removeProfileImage(userId);
        return ResponseEntity.ok(ApiResponse.success("프로필 이미지가 삭제되었습니다.", UserProfileResponse.from(updated)));
    }
}
