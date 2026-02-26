package com.globalledger.inbound.web.dto.response;

import java.util.List;

public record TransactionPageResponse(List<TransactionResponse> content, boolean hasNext, int page) {
}
