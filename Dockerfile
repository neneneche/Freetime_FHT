# ============================================================
# Freetime — Multi-stage Docker build
# Stage 1: Build with Maven + JDK 17
# Stage 2: Run with lightweight JRE 17
# ============================================================

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom first for better layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# === Runtime ===
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Minimal runtime user
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build /app/target/freetime-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8032

ENTRYPOINT ["java", "-jar", "app.jar"]