package com.globalledger.domain.port.input;

import com.globalledger.domain.vo.DashboardHome;

import java.util.UUID;

public interface DashboardHomePort {
    DashboardHome getDashboardHome(UUID userId);
}
