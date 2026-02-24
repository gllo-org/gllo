package com.globalledger.domain.model;

import java.util.List;

public class OnboardingCategoryTemplate {

    public record CategorySpec(String name, CategoryType type, String color) {}

    private static final List<CategorySpec> EXCHANGE_STUDENT_DE = List.of(
            new CategorySpec("비자 발급비", CategoryType.EXPENSE, "#795548"),
            new CategorySpec("Kaution", CategoryType.EXPENSE, "#FF5722"),
            new CategorySpec("Rundfunkbeitrag", CategoryType.EXPENSE, "#3F51B5"),
            new CategorySpec("기숙사비", CategoryType.EXPENSE, "#009688"),
            new CategorySpec("항공권", CategoryType.EXPENSE, "#607D8B"),
            new CategorySpec("식료품", CategoryType.EXPENSE, "#4CAF50"),
            new CategorySpec("교통비", CategoryType.EXPENSE, "#2196F3"),
            new CategorySpec("의료비", CategoryType.EXPENSE, "#F44336")
    );

    private static final List<CategorySpec> WORKING_HOLIDAY = List.of(
            new CategorySpec("숙박비", CategoryType.EXPENSE, "#009688"),
            new CategorySpec("항공권", CategoryType.EXPENSE, "#607D8B"),
            new CategorySpec("식료품", CategoryType.EXPENSE, "#4CAF50"),
            new CategorySpec("교통비", CategoryType.EXPENSE, "#2196F3"),
            new CategorySpec("외식비", CategoryType.EXPENSE, "#FF9800"),
            new CategorySpec("의료비", CategoryType.EXPENSE, "#F44336"),
            new CategorySpec("급여", CategoryType.INCOME, "#8BC34A"),
            new CategorySpec("부업", CategoryType.INCOME, "#CDDC39")
    );

    private static final List<CategorySpec> COMMON = List.of(
            new CategorySpec("숙박비", CategoryType.EXPENSE, "#009688"),
            new CategorySpec("항공권", CategoryType.EXPENSE, "#607D8B"),
            new CategorySpec("식료품", CategoryType.EXPENSE, "#4CAF50"),
            new CategorySpec("교통비", CategoryType.EXPENSE, "#2196F3"),
            new CategorySpec("외식비", CategoryType.EXPENSE, "#FF9800"),
            new CategorySpec("생활용품", CategoryType.EXPENSE, "#9C27B0"),
            new CategorySpec("의료비", CategoryType.EXPENSE, "#F44336")
    );

    public static List<CategorySpec> getTemplates(StayPurpose purpose, String country) {
        if (purpose == StayPurpose.EXCHANGE_STUDENT && "DE".equals(country)) {
            return EXCHANGE_STUDENT_DE;
        }
        if (purpose == StayPurpose.WORKING_HOLIDAY) {
            return WORKING_HOLIDAY;
        }
        return COMMON;
    }
}
