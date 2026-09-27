package za.ac.cput.dealnest.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import za.ac.cput.dealnest.domain.Store;
import za.ac.cput.dealnest.domain.Subscription;
import za.ac.cput.dealnest.domain.SubscriptionAccountType;
import za.ac.cput.dealnest.domain.SubscriptionPaymentMethod;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.repository.IPromotionRepository;
import za.ac.cput.dealnest.repository.IStoreRepository;
import za.ac.cput.dealnest.repository.ISubscriptionRepository;
import za.ac.cput.dealnest.repository.IUserRepository;
import za.ac.cput.dealnest.util.PayFastUtil;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SubscriptionServiceCheckoutTest {

    private static final String PASSPHRASE = "test-passphrase";

    private ISubscriptionRepository subscriptionRepository;
    private IUserRepository userRepository;
    private IStoreRepository storeRepository;
    private SubscriptionService service;

    @BeforeEach
    void setUp() {
        subscriptionRepository = mock(ISubscriptionRepository.class);
        userRepository = mock(IUserRepository.class);
        storeRepository = mock(IStoreRepository.class);

        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(invocation -> {
            Subscription subscription = invocation.getArgument(0);
            if (subscription.getSubscriptionID() == null) {
                subscription.setSubscriptionID("sub-1");
            }
            return subscription;
        });
        when(subscriptionRepository.findTopByAccountIdAndAccountTypeOrderByCreatedAtDesc(any(), any()))
                .thenReturn(Optional.empty());

        service = new SubscriptionService(
                subscriptionRepository,
                userRepository,
                storeRepository,
                mock(IPromotionRepository.class)
        );
        ReflectionTestUtils.setField(service, "merchantId", "merchant-1");
        ReflectionTestUtils.setField(service, "merchantKey", "merchant-key");
        ReflectionTestUtils.setField(service, "passphrase", PASSPHRASE);
        ReflectionTestUtils.setField(service, "sandbox", true);
        ReflectionTestUtils.setField(service, "plusAmount", "49.00");
        ReflectionTestUtils.setField(service, "proAmount", "199.00");
        ReflectionTestUtils.setField(service, "returnUrl", "https://app.dealnest.co.za/profile?payfast=success");
        ReflectionTestUtils.setField(service, "cancelUrl", "https://app.dealnest.co.za/profile?payfast=cancelled");
        ReflectionTestUtils.setField(service, "notifyUrl", "https://api.dealnest.co.za/api/payfast/itn");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user-1", null, java.util.List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @SuppressWarnings("unchecked")
    void prefillsAccountDetailsAndForcesCardCheckout() {
        User user = new User.Builder()
                .setUserID("user-1")
                .setFirstName("Thandi")
                .setLastName("Mokoena")
                .setEmail("thandi@example.com")
                .setPhoneNumber("0821234567")
                .build();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        Map<String, Object> checkout = service.checkout(SubscriptionAccountType.USER);
        Map<String, String> fields = (Map<String, String>) checkout.get("fields");

        assertEquals("https://sandbox.payfast.co.za/eng/process", checkout.get("action"));
        assertEquals("Thandi", fields.get("name_first"));
        assertEquals("Mokoena", fields.get("name_last"));
        assertEquals("thandi@example.com", fields.get("email_address"));
        assertEquals("0821234567", fields.get("cell_number"));
        assertEquals("cc", fields.get("payment_method"));
        assertEquals("1", fields.get("email_confirmation"));
        assertEquals("thandi@example.com", fields.get("confirmation_address"));
        assertTrue(fields.containsKey("signature"));
        assertFalse(fields.get("signature").isBlank());
    }

    @Test
    @SuppressWarnings("unchecked")
    void usesOwningAccountDetailsForStoreSubscriptions() {
        User owner = new User.Builder()
                .setUserID("user-1")
                .setFirstName("Sipho")
                .setLastName("Dlamini")
                .setEmail("sipho@dlamini.co.za")
                .setPhoneNumber("0719876543")
                .build();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(owner));

        Store store = new Store.Builder()
                .setStoreId("store-1")
                .setStoreName("Dlamini Electrical")
                .setEmail("shop@dlamini.co.za")
                .build();
        when(storeRepository.findByUser_UserID("user-1")).thenReturn(Optional.of(store));

        Map<String, Object> checkout = service.checkout(SubscriptionAccountType.STORE);
        Map<String, String> fields = (Map<String, String>) checkout.get("fields");

        assertEquals("Sipho", fields.get("name_first"));
        assertEquals("Dlamini", fields.get("name_last"));
        assertEquals("sipho@dlamini.co.za", fields.get("email_address"));
        assertEquals("0719876543", fields.get("cell_number"));
        assertEquals("cc", fields.get("payment_method"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void eftCheckoutIsAOneOffBankTransferWithoutRecurringFields() {
        User user = new User.Builder()
                .setUserID("user-1")
                .setFirstName("Thandi")
                .setLastName("Mokoena")
                .setEmail("thandi@example.com")
                .setPhoneNumber("0821234567")
                .build();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        Map<String, Object> checkout = service.checkout(SubscriptionAccountType.USER,
                SubscriptionPaymentMethod.EFT);
        Map<String, String> fields = (Map<String, String>) checkout.get("fields");

        assertEquals("ef", fields.get("payment_method"));
        assertEquals("EFT", fields.get("custom_str4"));
        assertTrue(fields.get("item_name").contains("30-day access"), "EFT is a single 30-day pass");
        assertFalse(fields.containsKey("subscription_type"), "EFT cannot be a PayFast subscription");
        assertFalse(fields.containsKey("recurring_amount"), "EFT does not renew itself");
        assertFalse(fields.containsKey("frequency"), "EFT does not renew itself");
        assertFalse(fields.containsKey("cycles"), "EFT does not renew itself");
        assertEquals("Thandi", fields.get("name_first"));
        assertEquals("Mokoena", fields.get("name_last"));
        assertEquals("thandi@example.com", fields.get("email_address"));
        assertEquals("0821234567", fields.get("cell_number"));
        assertFalse(fields.get("signature").isBlank());
    }

    @Test
    @SuppressWarnings("unchecked")
    void cardCheckoutKeepsRecurringSubscriptionFields() {
        User user = new User.Builder()
                .setUserID("user-1")
                .setFirstName("Thandi")
                .setLastName("Mokoena")
                .setEmail("thandi@example.com")
                .build();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        Map<String, Object> checkout = service.checkout(SubscriptionAccountType.USER,
                SubscriptionPaymentMethod.CARD);
        Map<String, String> fields = (Map<String, String>) checkout.get("fields");

        assertEquals("cc", fields.get("payment_method"));
        assertEquals("1", fields.get("subscription_type"));
        assertEquals("49.00", fields.get("recurring_amount"));
        assertEquals("3", fields.get("frequency"));
        assertEquals("0", fields.get("cycles"));
    }

    @Test
    void recordsTheChosenPaymentMethodOnTheSubscription() {
        User user = new User.Builder()
                .setUserID("user-1")
                .setFirstName("Thandi")
                .setLastName("Mokoena")
                .setEmail("thandi@example.com")
                .build();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        service.checkout(SubscriptionAccountType.USER, SubscriptionPaymentMethod.EFT);

        var saved = org.mockito.ArgumentCaptor.forClass(Subscription.class);
        verify(subscriptionRepository).save(saved.capture());
        assertEquals(SubscriptionPaymentMethod.EFT, saved.getValue().getPaymentMethod());
        assertEquals(4900L, saved.getValue().getAmountCents());
    }

    @Test
    @SuppressWarnings("unchecked")
    void signatureCoversBuyerAndCardFields() {
        User user = new User.Builder()
                .setUserID("user-1")
                .setFirstName("Thandi")
                .setLastName("Mokoena")
                .setEmail("thandi@example.com")
                .setPhoneNumber("0821234567")
                .build();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        Map<String, Object> checkout = service.checkout(SubscriptionAccountType.USER);
        Map<String, String> fields = (Map<String, String>) checkout.get("fields");

        String signature = fields.remove("signature");
        assertEquals(PayFastUtil.signature(new LinkedHashMap<>(fields), PASSPHRASE), signature);
        assertNotNull(fields.get("payment_method"));
    }

    @Test
    void refusesToSignCheckoutWithoutPassphrase() {
        User user = new User.Builder()
                .setUserID("user-1")
                .setFirstName("Thandi")
                .setLastName("Mokoena")
                .setEmail("thandi@example.com")
                .build();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        ReflectionTestUtils.setField(service, "passphrase", "  ");

        var ex = assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.checkout(SubscriptionAccountType.USER));
        assertTrue(ex.getMessage().contains("PAYFAST_PASSPHRASE"));
    }
}
