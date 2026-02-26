package com.globalledger.shared.response;

import java.util.List;

public record PageResult<T>(List<T> content, boolean hasNext, int page) {
}
