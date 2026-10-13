# ==============================================================================
# SMART AGRICULTURE MONITORING SYSTEM (SAMS)
# Multi-Stage Dockerfile for Production Deployment
# ==============================================================================

# Stage 1: Build the Application
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven Wrapper and POM first to leverage Docker layer caching
COPY backend/.mvn/ .mvn/
COPY backend/mvnw backend/pom.xml ./
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

# Copy backend source code and build the production JAR
COPY backend/src/ src/
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add a non-root system user for security
RUN addgroup -S samsgroup && adduser -S samsuser -G samsgroup
USER samsuser

# Copy the built JAR artifact from builder stage
COPY --from=builder /app/target/smart-agriculture-backend-*.jar app.jar

# Expose standard application port
EXPOSE 8080

# Configure JVM flags optimized for container environments
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"
ENV SPRING_PROFILES_ACTIVE="h2"

# Start the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
