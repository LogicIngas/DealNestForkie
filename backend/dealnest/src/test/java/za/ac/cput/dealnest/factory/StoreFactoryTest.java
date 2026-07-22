package za.ac.cput.dealnest.factory;

import org.junit.jupiter.api.Test;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.StoreCategory;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class StoreFactoryTest {

    @Test
    void createStore() {

        String storeId = UUID.randomUUID().toString();

        Store store = StoreFactory.createStore(
                storeId,
                StoreCategory.GROCERY,      // Change if your enum values differ
                "Fresh Mart",
                "Local grocery store",
                "freshmart@gmail.com",
                "0821234567",
                "123 Main Road",
                "Cape Town",
                -33.9249,
                18.4241,
                LocalTime.of(8, 0),
                LocalTime.of(18, 0),
                true,
                true,
                4.5,
                120,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        assertNotNull(store);
        assertEquals(StoreCategory.GROCERY, store.getCategory());
        assertEquals("Fresh Mart", store.getStoreName());
        assertEquals("Local grocery store", store.getDescription());
        assertEquals("freshmart@gmail.com", store.getEmail());
        assertEquals("0821234567", store.getPhoneNumber());
        assertEquals("123 Main Road", store.getAddress());
        assertEquals("Cape Town", store.getCity());
        assertEquals(-33.9249, store.getLatitude());
        assertEquals(18.4241, store.getLongitude());
        assertEquals(LocalTime.of(8, 0), store.getOpeningTime());
        assertEquals(LocalTime.of(18, 0), store.getClosingTime());
        assertTrue(store.getVerified());
        assertTrue(store.getActive());
        assertEquals(4.5, store.getAverageRating());
        assertEquals(120, store.getTotalReviews());
    }

    @Test
    void createStoreWithInvalidEmail() {

        Store store = StoreFactory.createStore(
                UUID.randomUUID().toString(),
                StoreCategory.GROCERY,
                "Fresh Mart",
                "Local grocery store",
                "invalid-email",
                "0821234567",
                "123 Main Road",
                "Cape Town",
                -33.9249,
                18.4241,
                LocalTime.of(8, 0),
                LocalTime.of(18, 0),
                true,
                true,
                4.5,
                120,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        assertNull(store);
    }

    @Test
    void createStoreWithInvalidOperatingHours() {

        Store store = StoreFactory.createStore(
                UUID.randomUUID().toString(),
                StoreCategory.GROCERY,
                "Fresh Mart",
                "Local grocery store",
                "freshmart@gmail.com",
                "0821234567",
                "123 Main Road",
                "Cape Town",
                -33.9249,
                18.4241,
                LocalTime.of(18, 0), // Opens after it closes
                LocalTime.of(8, 0),
                true,
                true,
                4.5,
                120,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        assertNull(store);
    }

    @Test
    void createStoreWithEmptyStoreName() {

        Store store = StoreFactory.createStore(
                UUID.randomUUID().toString(),
                StoreCategory.GROCERY,
                "",
                "Local grocery store",
                "freshmart@gmail.com",
                "0821234567",
                "123 Main Road",
                "Cape Town",
                -33.9249,
                18.4241,
                LocalTime.of(8, 0),
                LocalTime.of(18, 0),
                true,
                true,
                4.5,
                120,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        assertNull(store);
    }
}