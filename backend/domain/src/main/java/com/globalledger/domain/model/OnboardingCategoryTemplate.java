package com.globalledger.domain.model;

import java.util.List;

public class OnboardingCategoryTemplate {

    public record CategorySpec(String name, CategoryType type, String color) {}

    private static final List<CategorySpec> DEFAULT = List.of(
            new CategorySpec("식비", CategoryType.EXPENSE, "#9CA3AF"),
            new CategorySpec("주거비", CategoryType.EXPENSE, "#9CA3AF"),
            new CategorySpec("쇼핑", CategoryType.EXPENSE, "#9CA3AF"),
            new CategorySpec("통신비", CategoryType.EXPENSE, "#9CA3AF"),
            new CategorySpec("교통비", CategoryType.EXPENSE, "#9CA3AF"),
            new CategorySpec("급여", CategoryType.INCOME, "#9CA3AF"),
            new CategorySpec("용돈", CategoryType.INCOME, "#9CA3AF")
    );

    public static List<CategorySpec> getTemplates(StayPurpose purpose, String country) {
        return DEFAULT;
    }
}
