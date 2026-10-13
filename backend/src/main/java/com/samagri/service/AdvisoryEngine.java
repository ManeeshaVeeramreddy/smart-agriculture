package com.samagri.service;

import com.samagri.dto.AdviceItemDto;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Pure, framework-free rules that turn a field's latest readings into plain-language advice.
 * Kept free of Spring/JPA so it can be unit-tested in isolation and explained easily in a viva.
 *
 * Water estimate (a deliberately simple, documented heuristic):
 *   target moisture  = highest (crop minimum moisture + 10), clamped to 40..50 (40 if no crop)
 *   deficit (%)      = target - current moisture
 *   1 % deficit      ~ 2.5 mm of water over a 25 cm root zone
 *   1 mm over 1 acre = 4046.86 litres
 */
public final class AdvisoryEngine {

    public static final double IRRIGATION_THRESHOLD = 30.0;
    public static final double WATER_SOON_LIMIT = 38.0;
    public static final double MM_PER_PERCENT_DEFICIT = 2.5;
    public static final double LITRES_PER_MM_PER_ACRE = 4046.86;
    public static final long STALE_AFTER_HOURS = 72;

    public static final String STATUS_URGENT = "URGENT";
    public static final String STATUS_WATCH = "WATCH";
    public static final String STATUS_GOOD = "GOOD";
    public static final String STATUS_NO_DATA = "NO_DATA";

    private AdvisoryEngine() {
    }

    /** What the engine needs to know about one crop growing in the field. */
    public static class CropInfo {
        public final String name;
        public final Double minTemp;
        public final Double maxTemp;
        public final Double minMoisture;
        public final Double maxMoisture;
        public final Integer daysToHarvest; // null if unknown

        public CropInfo(String name, Double minTemp, Double maxTemp, Double minMoisture,
                        Double maxMoisture, Integer daysToHarvest) {
            this.name = name;
            this.minTemp = minTemp;
            this.maxTemp = maxTemp;
            this.minMoisture = minMoisture;
            this.maxMoisture = maxMoisture;
            this.daysToHarvest = daysToHarvest;
        }
    }

    public static List<AdviceItemDto> advise(String fieldName, double areaAcres, Double temperature,
                                             Double humidity, Double soilMoisture,
                                             LocalDateTime readingTime, LocalDateTime now,
                                             List<CropInfo> crops) {
        List<AdviceItemDto> out = new ArrayList<>();
        List<CropInfo> cropList = crops == null ? new ArrayList<>() : crops;

        if (soilMoisture == null) {
            out.add(item("NO_DATA", "WARNING",
                    "No soil check yet for " + fieldName + ". Do a quick soil check so I can advise you.",
                    "field", fieldName));
            addHarvest(out, fieldName, cropList);
            return out;
        }

        // How old is the reading?
        if (readingTime != null && now != null) {
            long hours = Duration.between(readingTime, now).toHours();
            if (hours >= STALE_AFTER_HOURS) {
                out.add(item("STALE_DATA", "INFO",
                        "The last check on " + fieldName + " was " + (hours / 24) + " days ago. Please check the soil again.",
                        "field", fieldName, "days", hours / 24));
            }
        }

        // Water
        if (soilMoisture < IRRIGATION_THRESHOLD) {
            double target = targetMoisture(cropList);
            double deficit = Math.max(0, target - soilMoisture);
            double depthMm = deficit * MM_PER_PERCENT_DEFICIT;
            long litres = roundTo(depthMm * LITRES_PER_MM_PER_ACRE * Math.max(areaAcres, 0), 1000);
            out.add(item("IRRIGATE_NOW", "URGENT",
                    String.format(Locale.ENGLISH,
                            "%s is dry (soil moisture %.0f%%). Water it now: about %.1f cm of water, roughly %d litres.",
                            fieldName, soilMoisture, depthMm / 10.0, litres),
                    "field", fieldName, "moisture", Math.round(soilMoisture),
                    "depthCm", Math.round(depthMm) / 10.0, "litres", litres,
                    "crops", cropNames(cropList)));
        } else if (soilMoisture < WATER_SOON_LIMIT) {
            out.add(item("WATER_SOON", "WARNING",
                    String.format(Locale.ENGLISH,
                            "%s will need water in a day or two (soil moisture %.0f%%).", fieldName, soilMoisture),
                    "field", fieldName, "moisture", Math.round(soilMoisture)));
        } else if (soilMoisture > wetLimit(cropList)) {
            out.add(item("TOO_WET", "WARNING",
                    String.format(Locale.ENGLISH,
                            "%s is too wet (soil moisture %.0f%%). Do not irrigate and let extra water drain out.",
                            fieldName, soilMoisture),
                    "field", fieldName, "moisture", Math.round(soilMoisture)));
        }

        // Temperature
        if (temperature != null) {
            List<String> hot = new ArrayList<>();
            List<String> cold = new ArrayList<>();
            if (cropList.isEmpty()) {
                if (temperature > 38) hot.add("");
                if (temperature < 10) cold.add("");
            } else {
                for (CropInfo c : cropList) {
                    if (c.maxTemp != null && temperature > c.maxTemp) hot.add(c.name);
                    if (c.minTemp != null && temperature < c.minTemp) cold.add(c.name);
                }
            }
            if (!hot.isEmpty()) {
                out.add(item("HEAT_STRESS", "WARNING",
                        String.format(Locale.ENGLISH,
                                "It is hot (%.0f°C) for %s. Water in the early morning or evening, not at noon.",
                                temperature, joinNames(hot, "your crop")),
                        "field", fieldName, "temp", Math.round(temperature), "crops", joinNames(hot, "")));
            }
            if (!cold.isEmpty()) {
                out.add(item("COLD_RISK", "WARNING",
                        String.format(Locale.ENGLISH,
                                "It is cold (%.0f°C) for %s. Protect young plants at night.",
                                temperature, joinNames(cold, "your crop")),
                        "field", fieldName, "temp", Math.round(temperature), "crops", joinNames(cold, "")));
            }
        }

        // Disease risk: warm + very humid air favours fungus
        if (humidity != null && humidity >= 85 && (temperature == null || (temperature >= 18 && temperature <= 32))) {
            out.add(item("DISEASE_RISK", "WARNING",
                    String.format(Locale.ENGLISH,
                            "Air is very humid (%.0f%%) - fungus and blight can spread. Look at the leaves in %s and avoid watering in the evening.",
                            humidity, fieldName),
                    "field", fieldName, "humidity", Math.round(humidity)));
        }

        addHarvest(out, fieldName, cropList);

        boolean problem = out.stream().anyMatch(a -> "URGENT".equals(a.getSeverity()) || "WARNING".equals(a.getSeverity()));
        if (!problem) {
            out.add(item("ALL_GOOD", "GOOD",
                    String.format(Locale.ENGLISH, "%s is fine today (soil moisture %.0f%%). No water needed.",
                            fieldName, soilMoisture),
                    "field", fieldName, "moisture", Math.round(soilMoisture)));
        }
        return out;
    }

    /** URGENT if any urgent advice, WATCH if any warning, NO_DATA without readings, else GOOD. */
    public static String overallStatus(Double soilMoisture, List<AdviceItemDto> advice) {
        if (soilMoisture == null) {
            return STATUS_NO_DATA;
        }
        boolean warning = false;
        for (AdviceItemDto a : advice) {
            if ("URGENT".equals(a.getSeverity())) {
                return STATUS_URGENT;
            }
            if ("WARNING".equals(a.getSeverity())) {
                warning = true;
            }
        }
        return warning ? STATUS_WATCH : STATUS_GOOD;
    }

    /** Maps the "squeeze a handful of soil" answer to an approximate soil moisture percentage. */
    public static double moistureFromFeel(String feel) {
        if (feel == null) {
            throw new IllegalArgumentException("Soil feel is required");
        }
        switch (feel.trim().toUpperCase(Locale.ROOT)) {
            case "DRY":
                return 20.0;   // dusty / crumbles, below the 30 % irrigation threshold
            case "MOIST":
                return 45.0;   // forms a ball that breaks easily
            case "WET":
                return 85.0;   // water drips, sticky mud (saturated)
            default:
                throw new IllegalArgumentException("Soil feel must be DRY, MOIST or WET");
        }
    }

    // ------------------------------------------------------------------ helpers

    static double targetMoisture(List<CropInfo> crops) {
        double target = 40.0;
        for (CropInfo c : crops) {
            if (c.minMoisture != null) {
                target = Math.max(target, c.minMoisture + 10.0);
            }
        }
        return Math.min(target, 50.0);
    }

    /** Above this the soil is waterlogged for at least one crop in the field (crop maximum + 5 points, never above 85). */
    static double wetLimit(List<CropInfo> crops) {
        double limit = 80.0;
        boolean any = false;
        for (CropInfo c : crops) {
            if (c.maxMoisture != null) {
                limit = any ? Math.min(limit, c.maxMoisture + 5.0) : c.maxMoisture + 5.0;
                any = true;
            }
        }
        return Math.min(limit, 85.0);
    }

    private static void addHarvest(List<AdviceItemDto> out, String fieldName, List<CropInfo> crops) {
        for (CropInfo c : crops) {
            if (c.daysToHarvest != null && c.daysToHarvest >= 0 && c.daysToHarvest <= 10) {
                out.add(item("HARVEST_SOON", "INFO",
                        c.name + " in " + fieldName + " is ready to harvest in about " + c.daysToHarvest + " days.",
                        "field", fieldName, "crop", c.name, "days", c.daysToHarvest));
            }
        }
    }

    private static String cropNames(List<CropInfo> crops) {
        List<String> names = new ArrayList<>();
        for (CropInfo c : crops) {
            if (!names.contains(c.name)) {
                names.add(c.name);
            }
        }
        return joinNames(names, "");
    }

    private static String joinNames(List<String> names, String fallback) {
        List<String> clean = new ArrayList<>();
        for (String n : names) {
            if (n != null && !n.isBlank() && !clean.contains(n)) {
                clean.add(n);
            }
        }
        return clean.isEmpty() ? fallback : String.join(", ", clean);
    }

    private static long roundTo(double value, long step) {
        if (value <= 0) {
            return 0;
        }
        return Math.max(step, Math.round(value / step) * step);
    }

    private static AdviceItemDto item(String code, String severity, String message, Object... kv) {
        Map<String, Object> params = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) {
            params.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return new AdviceItemDto(code, severity, message, params);
    }
}
