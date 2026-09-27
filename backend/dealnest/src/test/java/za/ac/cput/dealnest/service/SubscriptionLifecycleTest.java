package za.ac.cput.dealnest.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import za.ac.cput.dealnest.domain.Subscription;
import za.ac.cput.dealnest.domain.SubscriptionAccountType;
import za.ac.cput.dealnest.domain.SubscriptionPaymentMethod;
import za.ac.cput.dealnest.domain.SubscriptionStatus;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.UserPlanTier;
import za.ac.cput.dealnest.repository.IPromotionRepository;
import za.ac.cput.dealnest.repository.IStoreRepository;
import za.ac.cput.dealnest.repository.ISubscriptionRepository;
import za.ac.cput.dealnest.repository.IUserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * A card subscription rolls its renewal forward with each monthly ITN, so it
 * gets a grace period. A one-off EFT pass never gets another ITN, so the paid
 * 30 days is all the access there is — it must lapse exactly on time.
 */
class SubscriptionLifecycleTest {

    private ISubscriptionRepository subscriptionRepository;
    private IUserRepository userRepository;
    private SubscriptionService service;

    @BeforeEach
    void setUp() {
        subscriptionRepository = mock(ISubscriptionRepository.class);
        userRepository = mock(IUserRepository.class);
        service = new SubscriptionService(
                subscriptionRepository,
                userRepository,
                mock(IStoreRepository.class),
                mock(IPromotionRepository.class)
        );
    }

    @Test
    void oneOffEftPassLapsesExactlyWhenThePaidDaysRunOut() {
        User user = plusUser();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        Subscription eft = active(SubscriptionPaymentMethod.EFT, LocalDateTime.now().minusHours(1));
        when(subscriptionRepository.findByStatusInAndRenewsAtBefore(anyList(), any()))
                .thenReturn(List.of(eft));

        service.syncDueSubscriptions();

        assertEquals(UserPlanTier.FREE, user.getPlanTier());
        assertNull(user.getPlanRenewsAt());
        assertEquals(SubscriptionStatus.EXPIRED, eft.getStatus());
    }

    @Test
    void oneOffEftPassKeepsAccessUntilTheLastDay() {
        User user = plusUser();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        Subscription eft = active(SubscriptionPaymentMethod.EFT, LocalDateTime.now().plusDays(2));
        when(subscriptionRepository.findByStatusInAndRenewsAtBefore(anyList(), any()))
                .thenReturn(List.of(eft));

        service.syncDueSubscriptions();

        assertEquals(UserPlanTier.PLUS, user.getPlanTier());
        assertEquals(SubscriptionStatus.ACTIVE, eft.getStatus());
    }

    @Test
    void cardSubscriptionSurvivesTheGracePeriodForALateItn() {
        User user = plusUser();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        Subscription card = active(SubscriptionPaymentMethod.CARD, LocalDateTime.now().minusDays(1));
        when(subscriptionRepository.findByStatusInAndRenewsAtBefore(anyList(), any()))
                .thenReturn(List.of(card));

        service.syncDueSubscriptions();

        assertEquals(UserPlanTier.PLUS, user.getPlanTier());
    }

    @Test
    void cardSubscriptionLapsesWhenNoItnArrives() {
        User user = plusUser();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        Subscription card = active(SubscriptionPaymentMethod.CARD, LocalDateTime.now().minusDays(3));
        when(subscriptionRepository.findByStatusInAndRenewsAtBefore(anyList(), any()))
                .thenReturn(List.of(card));

        service.syncDueSubscriptions();

        assertEquals(UserPlanTier.FREE, user.getPlanTier());
        assertEquals(SubscriptionStatus.EXPIRED, card.getStatus());
    }

    @Test
    void cancelledPlansLoseAccessAtTheEndOfThePaidPeriod() {
        User user = plusUser();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        Subscription card = active(SubscriptionPaymentMethod.CARD, LocalDateTime.now().minusDays(1));
        card.setStatus(SubscriptionStatus.CANCELED);
        when(subscriptionRepository.findByStatusInAndRenewsAtBefore(anyList(), any()))
                .thenReturn(List.of(card));

        service.syncDueSubscriptions();

        assertEquals(UserPlanTier.FREE, user.getPlanTier());
        verify(subscriptionRepository).save(card);
    }

    private Subscription active(SubscriptionPaymentMethod method, LocalDateTime renewsAt) {
        return new Subscription.Builder()
                .setSubscriptionID("sub-1")
                .setAccountId("user-1")
                .setAccountType(SubscriptionAccountType.USER)
                .setPlanKey("PLUS")
                .setPaymentMethod(method)
                .setAmountCents(4900)
                .setCurrency("ZAR")
                .setStatus(SubscriptionStatus.ACTIVE)
                .setRenewsAt(renewsAt)
                .build();
    }

    private User plusUser() {
        User user = new User.Builder()
                .setUserID("user-1")
                .setFirstName("Thandi")
                .setLastName("Mokoena")
                .setEmail("thandi@example.com")
                .build();
        user.setPlanTier(UserPlanTier.PLUS);
        user.setPlanRenewsAt(LocalDateTime.now().plusDays(10));
        return user;
    }
}
