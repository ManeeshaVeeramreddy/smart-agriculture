package com.samagri;

import com.samagri.dto.AdviceItemDto;
import com.samagri.service.AdvisoryEngine;
import com.samagri.service.AdvisoryEngine.CropInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Plain unit tests - no Spring context or database needed. */
class AdvisoryEngineTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 6, 1, 10, 0);
    private static final CropInfo RICE = new CropInfo("Rice", 20.0, 38.0, 50.0, 80.0, 90);

    private static List<AdviceItemDto> advise(Double temp, Double hum, Double moist, CropInfo... crops) {
        return AdvisoryEngine.advise("Field A", 2.0, temp, hum, moist, NOW.minusHours(1), NOW, List.of(crops));
    }

    private static AdviceItemDto find(List<AdviceItemDto> list, String code) {
        return list.stream().filter(a -> a.getCode().equals(code)).findFirst().orElse(null);
    }

    @Test
    @DisplayName("Below 30% moisture -> urgent irrigation with a litres estimate")
    void dryFieldNeedsWater() {
        List<AdviceItemDto> advice = advise(28.0, 60.0, 25.0, RICE);
        AdviceItemDto a = find(advice, "IRRIGATE_NOW");
        assertNotNull(a);
        assertEquals("URGENT", a.getSeverity());
        // Rice -> target capped at 50%; deficit 25% -> 62.5 mm over 2 acres = 505,857 L, rounded to the nearest 1000
        assertEquals(506000L, a.getParams().get("litres"));
        assertEquals("URGENT", AdvisoryEngine.overallStatus(25.0, advice));
    }

    @Test
    @DisplayName("Exactly 30% is not dry (matches the irrigation rule in IrrigationService)")
    void thresholdBoundary() {
        assertNull(find(advise(28.0, 60.0, 30.0), "IRRIGATE_NOW"));
        assertNotNull(find(advise(28.0, 60.0, 29.9), "IRRIGATE_NOW"));
    }

    @Test
    void almostDryGivesWarning() {
        List<AdviceItemDto> advice = advise(28.0, 60.0, 34.0);
        assertNotNull(find(advice, "WATER_SOON"));
        assertEquals("WATCH", AdvisoryEngine.overallStatus(34.0, advice));
    }

    @Test
    void waterloggedField() {
        assertNotNull(find(advise(28.0, 60.0, 90.0), "TOO_WET"));
    }

    @Test
    @DisplayName("Waterlogging depends on the crop: paddy rice tolerates 75%, maize does not")
    void wetnessIsCropSpecific() {
        CropInfo maize = new CropInfo("Maize", 18.0, 32.0, 30.0, 65.0, 75);
        assertNotNull(find(advise(26.0, 60.0, 75.0, maize), "TOO_WET"));
        assertNull(find(advise(26.0, 60.0, 75.0, RICE), "TOO_WET"));
        assertNotNull(find(advise(26.0, 60.0, 85.1, RICE), "TOO_WET"));
    }

    @Test
    void healthyFieldGetsAllGood() {
        List<AdviceItemDto> advice = advise(26.0, 60.0, 50.0, RICE);
        assertNotNull(find(advice, "ALL_GOOD"));
        assertEquals("GOOD", AdvisoryEngine.overallStatus(50.0, advice));
    }

    @Test
    void heatStressNamesTheCrop() {
        AdviceItemDto a = find(advise(41.0, 50.0, 50.0, RICE), "HEAT_STRESS");
        assertNotNull(a);
        assertEquals("Rice", a.getParams().get("crops"));
    }

    @Test
    void humidWarmAirMeansDiseaseRisk() {
        assertNotNull(find(advise(26.0, 90.0, 50.0), "DISEASE_RISK"));
        assertNull(find(advise(12.0, 90.0, 50.0), "DISEASE_RISK"));
    }

    @Test
    void noReadingAsksForQuickCheck() {
        List<AdviceItemDto> advice = AdvisoryEngine.advise("Field A", 1, null, null, null, null, NOW, List.of());
        assertNotNull(find(advice, "NO_DATA"));
        assertEquals("NO_DATA", AdvisoryEngine.overallStatus(null, advice));
    }

    @Test
    void oldReadingIsFlagged() {
        List<AdviceItemDto> advice = AdvisoryEngine.advise("Field A", 1, 28.0, 60.0, 50.0,
                NOW.minusDays(5), NOW, List.of());
        assertNotNull(find(advice, "STALE_DATA"));
    }

    @Test
    void harvestReminder() {
        CropInfo soon = new CropInfo("Wheat", 15.0, 35.0, 35.0, 60.0, 4);
        assertNotNull(find(advise(25.0, 60.0, 50.0, soon), "HARVEST_SOON"));
    }

    @Test
    void feelTestMapping() {
        assertEquals(20.0, AdvisoryEngine.moistureFromFeel("dry"));
        assertEquals(45.0, AdvisoryEngine.moistureFromFeel("MOIST"));
        assertEquals(85.0, AdvisoryEngine.moistureFromFeel(" wet "));
        assertThrows(IllegalArgumentException.class, () -> AdvisoryEngine.moistureFromFeel("soggy"));
    }
}
