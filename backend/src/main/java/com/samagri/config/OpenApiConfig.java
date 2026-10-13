package com.samagri.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "BearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("Smart Agriculture Monitoring System (SAMS) API")
                        .version("1.1")
                        .description("REST API Documentation for Smart Agriculture Monitoring System. " +
                                "Supports Farmer management, field/crop tracking, manual/simulated sensor monitoring, " +
                                "automated irrigation logic (<30% threshold), alerts, and rule-based crop recommendation.")
                        .contact(new Contact()
                                .name("SAMS Development Team - VIT-AP University")
                                .email("contact@samagri.com"))
                        .license(new License().name("Educational Use Only")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
