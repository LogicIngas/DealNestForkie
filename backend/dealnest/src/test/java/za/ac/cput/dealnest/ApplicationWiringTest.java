package za.ac.cput.dealnest;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import za.ac.cput.dealnest.controller.CardPaymentController;
import za.ac.cput.dealnest.domain.Subscription;
import za.ac.cput.dealnest.repository.ISubscriptionRepository;
import za.ac.cput.dealnest.service.CardPaymentService;
import za.ac.cput.dealnest.service.SubscriptionService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Starts the whole application against an embedded database.
 *
 * <p>{@code DealnestApplicationTests} is meant to do this, but it inherits the
 * production datasource and so can only pass on a machine with Postgres running on
 * 5433. On every other machine it fails on the connection and never reaches the part
 * that matters: whether the beans wire together. A missing {@code @Service}, a
 * constructor Spring cannot satisfy, or an entity field that will not map all fail
 * as "context did not load" here and are otherwise invisible until deploy.
 *
 * <p>The same wiring problem is what makes it easy to add a controller that depends
 * on a service nobody registered — the application starts fine, because Spring
 * resolves the graph lazily enough that nothing notices until the first request.
 */
@Transactional
@SpringBootTest(properties = {        "spring.datasource.url=jdbc:h2:mem:dealnest-wiring;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never",
        "spring.jpa.show-sql=false"
})
class ApplicationWiringTest {

    @Autowired
    private CardPaymentService cardPaymentService;

    @Autowired
    private CardPaymentController cardPaymentController;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private ISubscriptionRepository subscriptionRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void theCardPathIsWiredIntoTheContext() {
        // Both of these are only non-null if their annotations are present and
        // their dependencies resolve. Neither is reachable from a @DataJpaTest
        // slice, which is where the rest of the suite runs.
        assertNotNull(cardPaymentService, "CardPaymentService must be a bean");
        assertNotNull(cardPaymentController, "CardPaymentController must be a bean");
        assertNotNull(subscriptionService);
    }

    @Test
    void theCardPathIsEnabledWhereSimulationIsWanted() {
        // This test class is the development profile, where the checkout is meant to
        // work. If the default ever flips, the demo silently stops working and the
        // failure is much easier to trace here than from the UI.
        assertTrue(cardPaymentService.authorise("4111111111111111", 4900).isApproved(),
                "the card path should be usable in the development profile");
    }

    @Test
    void theCardFieldsActuallyPersistOnTheSubscription() {
        // The three card fields replaced two gateway columns on a table that
        // already holds real subscription rows. Building the schema proves the
        // mapping is valid; reading a row back proves the columns are really there
        // and not just fields Hibernate is quietly ignoring.
        Subscription saved = new Subscription.Builder()
                .setAccountId("user-1")
                .setCardBrand("VISA")
                .setCardLast4("1111")
                .setPaymentReference("SIM-WIRINGTEST")
                .build();
        subscriptionRepository.save(saved);

        entityManager.flush();
        entityManager.clear();

        Subscription reloaded = subscriptionRepository
                .findTopByPaymentReference("SIM-WIRINGTEST").orElseThrow();
        assertEquals("VISA", reloaded.getCardBrand());
        assertEquals("1111", reloaded.getCardLast4());
    }
}
