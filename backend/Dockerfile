FROM gradle:8.5-jdk17 AS build
WORKDIR /app

COPY build.gradle.kts settings.gradle.kts gradlew ./
COPY gradle gradle/

COPY api-app api-app/
COPY application application/
COPY domain domain/
COPY inbound inbound/
COPY infra infra/
COPY shared shared/

RUN chmod +x gradlew
RUN ./gradlew :api-app:build -x test --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/api-app/build/libs/app.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
CMD ["--spring.profiles.active=prod"]
