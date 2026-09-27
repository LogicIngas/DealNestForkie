package za.ac.cput.dealnest.service.impl;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.Redemption;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IRedemptionRepository;
import za.ac.cput.dealnest.service.EmailNotificationSender;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class VoucherNotificationServiceTest {

    private IRedemptionRepository repository;
    private EmailNotificationSender emailSender;
    private VoucherNotificationService service;

    @BeforeEach
    void setUp() {
        repository = mock(IRedemptionRepository.class);
        emailSender = mock(EmailNotificationSender.class);
        service = new VoucherNotificationService(repository, emailSender);
        ReflectionTestUtils.setField(service, "enabled", true);
        ReflectionTestUtils.setField(service, "cooldownMinutes", 60L);
        signInAs("user-1");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void signInAs(String userId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, java.util.List.of()));
    }

    @Test
    void putsTheVoucherCodeInTheHtmlBodySoItIsNotJustAnotherLineOfText() {
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(redemption("redemption-1", "user-1", "thandi@example.com")));
        when(emailSender.isConfigured()).thenReturn(true);

        service.sendVoucherEmail("redemption-1");

        var htmlCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(emailSender).send(anyString(), anyString(), anyString(), htmlCaptor.capture(), anyString());

        String html = htmlCaptor.getValue();
        assertTrue(html.contains("DN-ABC123XYZ"), "the html body must carry the code");
        assertTrue(html.contains("Cape Coffee Co"), "the html body must carry the store name");
    }

    @Test
    void escapesStoreSuppliedTextSoAnOwnerCannotInjectMarkupIntoTheEmail() {
        Store store = storeBuilder().setStoreName("Evil <script>alert(1)</script> & Co").build();
        Redemption redemption = redemption("redemption-1", "user-1", "thandi@example.com");
        redemption.getPromotion().setStore(store);
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(redemption));
        when(emailSender.isConfigured()).thenReturn(true);

        service.sendVoucherEmail("redemption-1");

        var htmlCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(emailSender).send(anyString(), anyString(), anyString(), htmlCaptor.capture(), anyString());

        String html = htmlCaptor.getValue();
        assertFalse(html.contains("<script>"), "a store name must never be able to inject a script tag");
        assertTrue(html.contains("&lt;script&gt;"), "the angle brackets should arrive escaped");
    }

    @Test
    void emailsTheVoucherToItsOwnerOnRequest() {
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(redemption("redemption-1", "user-1", "thandi@example.com")));
        when(emailSender.isConfigured()).thenReturn(true);

        VoucherNotificationService.Outcome outcome = service.sendVoucherEmail("redemption-1");

        assertEquals(VoucherNotificationService.Status.SENT, outcome.status());
        var messageCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(emailSender).send(eq("thandi@example.com"), anyString(), messageCaptor.capture(),
                anyString(), eq("voucher-claim:redemption-1:email"));
    }

    @Test
    void includesTheVoucherCodeStoreDetailsAndHours() {
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(redemption("redemption-1", "user-1", "thandi@example.com")));
        when(emailSender.isConfigured()).thenReturn(true);

        service.sendVoucherEmail("redemption-1");

        var messageCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(emailSender).send(anyString(), anyString(), messageCaptor.capture(), anyString(), anyString());

        String email = messageCaptor.getValue();
        assertTrue(email.contains("DN-ABC123XYZ"), "should contain the code");
        assertTrue(email.contains("Cape Coffee Co"), "should contain the store name");
        assertTrue(email.contains("12 Adderley Street"), "should contain the address");
        assertTrue(email.contains("Cape Town"), "should contain the city");
        assertTrue(email.contains("0212345678"), "should contain the store phone");
        assertTrue(email.contains("hello@capecoffee.co.za"), "should contain the store email");
        assertTrue(email.contains("Hours: 08:00 - 17:00"), "should contain the store hours");
    }

    @Test
    void omitsTheHoursLineWhenTheStoreHasNotSetThem() {
        Store store = storeBuilder().setOpeningTime(null).setClosingTime(null).build();
        Redemption r = redemption("redemption-1", "user-1", "thandi@example.com", store);
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(r));
        when(emailSender.isConfigured()).thenReturn(true);

        service.sendVoucherEmail("redemption-1");

        var messageCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(emailSender).send(anyString(), anyString(), messageCaptor.capture(), anyString(), anyString());
        assertFalse(messageCaptor.getValue().contains("Hours:"));
    }

    @Test
    void stampsTheSendTimeOnlyAfterASuccessfulSend() {
        Redemption r = redemption("redemption-1", "user-1", "thandi@example.com");
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(r));
        when(emailSender.isConfigured()).thenReturn(true);

        service.sendVoucherEmail("redemption-1");

        assertNotNull(r.getEmailedAt(), "a successful send should record when it happened");
        verify(repository).save(r);
    }

    @Test
    void doesNotStampTheSendTimeWhenTheProviderFails() {
        Redemption r = redemption("redemption-1", "user-1", "thandi@example.com");
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(r));
        when(emailSender.isConfigured()).thenReturn(true);
        doThrow(new IllegalStateException("brevo down")).when(emailSender)
                .send(anyString(), anyString(), anyString(), anyString(), anyString());

        VoucherNotificationService.Outcome outcome = service.sendVoucherEmail("redemption-1");

        assertEquals(VoucherNotificationService.Status.FAILED, outcome.status());
        assertNull(r.getEmailedAt(), "a provider outage must not start the cooldown");
    }

    @Test
    void refusesToEmailAVoucherBelongingToSomebodyElse() {
        when(repository.findDetailedById("redemption-1"))
                .thenReturn(Optional.of(redemption("redemption-1", "someone-else", "victim@example.com")));

        VoucherNotificationService.Outcome outcome = service.sendVoucherEmail("redemption-1");

        assertEquals(VoucherNotificationService.Status.NOT_FOUND, outcome.status());
        verify(emailSender, never()).send(anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void reportsAMissingVoucherIdenticallyToSomebodyElses() {
        when(repository.findDetailedById("nope")).thenReturn(Optional.empty());
        when(repository.findDetailedById("redemption-1"))
                .thenReturn(Optional.of(redemption("redemption-1", "someone-else", "victim@example.com")));

        VoucherNotificationService.Outcome missing = service.sendVoucherEmail("nope");

        assertEquals(VoucherNotificationService.Status.NOT_FOUND, missing.status());
        assertEquals(VoucherNotificationService.Status.NOT_FOUND,
                service.sendVoucherEmail("redemption-1").status(),
                "not-found and not-yours must be indistinguishable");
    }

    @Test
    void refusesWhenNobodyIsSignedIn() {
        SecurityContextHolder.clearContext();
        when(repository.findDetailedById("redemption-1"))
                .thenReturn(Optional.of(redemption("redemption-1", "user-1", "thandi@example.com")));

        VoucherNotificationService.Outcome outcome = service.sendVoucherEmail("redemption-1");

        assertEquals(VoucherNotificationService.Status.NOT_FOUND, outcome.status());
        verify(emailSender, never()).send(anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void blocksASecondSendInsideTheCooldownAndSaysHowLongToWait() {
        Redemption r = redemption("redemption-1", "user-1", "thandi@example.com");
        r.setEmailedAt(LocalDateTime.now().minusMinutes(10));
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(r));
        when(emailSender.isConfigured()).thenReturn(true);

        VoucherNotificationService.Outcome outcome = service.sendVoucherEmail("redemption-1");

        assertEquals(VoucherNotificationService.Status.RATE_LIMITED, outcome.status());
        assertEquals(50, outcome.retryAfterMinutes(), "60 minute cooldown, 10 minutes elapsed");
        verify(emailSender, never()).send(anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void allowsASendAgainOnceTheCooldownHasPassed() {
        Redemption r = redemption("redemption-1", "user-1", "thandi@example.com");
        r.setEmailedAt(LocalDateTime.now().minusMinutes(61));
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(r));
        when(emailSender.isConfigured()).thenReturn(true);

        assertEquals(VoucherNotificationService.Status.SENT, service.sendVoucherEmail("redemption-1").status());
    }

    @Test
    void treatsTheCooldownAsElapsedRatherThanGoingNegative() {
        Redemption r = redemption("redemption-1", "user-1", "thandi@example.com");
        r.setEmailedAt(LocalDateTime.now().minusHours(5));
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(r));
        when(emailSender.isConfigured()).thenReturn(true);

        assertEquals(0, service.sendVoucherEmail("redemption-1").retryAfterMinutes());
    }

    @Test
    void allowsUnlimitedSendsWhenTheCooldownIsZero() {
        ReflectionTestUtils.setField(service, "cooldownMinutes", 0L);
        Redemption r = redemption("redemption-1", "user-1", "thandi@example.com");
        r.setEmailedAt(LocalDateTime.now());
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(r));
        when(emailSender.isConfigured()).thenReturn(true);

        assertEquals(VoucherNotificationService.Status.SENT, service.sendVoucherEmail("redemption-1").status());
    }

    @Test
    void eachCooldownIsTrackedPerCodeNotPerUser() {
        Redemption justSent = redemption("redemption-1", "user-1", "thandi@example.com");
        justSent.setEmailedAt(LocalDateTime.now());
        Redemption neverSent = redemption("redemption-2", "user-1", "thandi@example.com");
        when(repository.findDetailedById("redemption-1")).thenReturn(Optional.of(justSent));
        when(repository.findDetailedById("redemption-2")).thenReturn(Optional.of(neverSent));
        when(emailSender.isConfigured()).thenReturn(true);

        assertEquals(VoucherNotificationService.Status.RATE_LIMITED, service.sendVoucherEmail("redemption-1").status());
        assertEquals(VoucherNotificationService.Status.SENT, service.sendVoucherEmail("redemption-2").status(),
                "one code's cooldown must not block a different code");
    }

    @Test
    void refusesWhenTheClaimerHasNoEmailAddress() {
        when(repository.findDetailedById("redemption-1"))
                .thenReturn(Optional.of(redemption("redemption-1", "user-1", null)));

        VoucherNotificationService.Outcome outcome = service.sendVoucherEmail("redemption-1");

        assertEquals(VoucherNotificationService.Status.NO_EMAIL_ADDRESS, outcome.status());
        verify(emailSender, never()).send(anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void reportsWhenTheProviderIsNotConfigured() {
        when(repository.findDetailedById("redemption-1"))
                .thenReturn(Optional.of(redemption("redemption-1", "user-1", "thandi@example.com")));
        when(emailSender.isConfigured()).thenReturn(false);

        assertEquals(VoucherNotificationService.Status.NOT_CONFIGURED, service.sendVoucherEmail("redemption-1").status());
    }

    @Test
    void reportsDisabledNotifications() {
        ReflectionTestUtils.setField(service, "enabled", false);
        when(repository.findDetailedById("redemption-1"))
                .thenReturn(Optional.of(redemption("redemption-1", "user-1", "thandi@example.com")));

        assertEquals(VoucherNotificationService.Status.NOT_CONFIGURED, service.sendVoucherEmail("redemption-1").status());
        verify(repository, never()).findDetailedById(anyString());
    }

    @Test
    void ignoresANullRedemptionId() {
        when(repository.findDetailedById(null)).thenReturn(Optional.empty());

        assertEquals(VoucherNotificationService.Status.NOT_FOUND, service.sendVoucherEmail(null).status());
    }

    private Store.Builder storeBuilder() {
        return new Store.Builder()
                .setStoreId("store-1")
                .setStoreName("Cape Coffee Co")
                .setAddress("12 Adderley Street")
                .setCity("Cape Town")
                .setPhoneNumber("0212345678")
                .setEmail("hello@capecoffee.co.za")
                .setOpeningTime(LocalTime.of(8, 0))
                .setClosingTime(LocalTime.of(17, 0));
    }

    private Redemption redemption(String redemptionId, String userId, String email) {
        return redemption(redemptionId, userId, email, storeBuilder().build());
    }

    private Redemption redemption(String redemptionId, String userId, String email, Store store) {
        User user = new User.Builder()
                .setUserID(userId)
                .setFirstName("Thandi")
                .setLastName("Mokoena")
                .setEmail(email)
                .build();
        Promotion promotion = new Promotion.Builder()
                .setPromotionID("promo-1")
                .setTitle("Two coffees for R50")
                .setEndDate(LocalDateTime.now().plusDays(14))
                .setStore(store)
                .build();
        return new Redemption.Builder()
                .setRedemptionID(redemptionId)
                .setCode("DN-ABC123XYZ")
                .setPromotion(promotion)
                .setUser(user)
                .build();
    }
}
