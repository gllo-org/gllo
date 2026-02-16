FROM gradle:8.5-jdk17 AS build
WORKDIR /app

COPY backend/build.gradle.kts backend/settings.gradle.kts backend/gradlew ./
COPY backend/gradle gradle/

COPY backend/api-app api-app/
COPY backend/application application/
COPY backend/domain domain/
COPY backend/inbound inbound/
COPY backend/infra infra/
COPY backend/shared shared/

RUN chmod +x gradlew
RUN ./gradlew :api-app:build -x test --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/api-app/build/libs/app.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
CMD ["--spring.profiles.active=prod"]
