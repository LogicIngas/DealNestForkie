package za.ac.cput.dealnest.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guards the failure mode {@code contextLoads} cannot see. Spring Data parses repository
 * method names and {@code @Query} JPQL while building the repository beans, which needs a
 * reachable DataSource. With no local database the context test dies on the JDBC
 * connection first, so a broken method can ship green locally and only fail at deploy
 * time. This slice uses an embedded database, so the query is genuinely parsed and run.
 */
@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.show-sql=false"
})
class IRedemptionRepositoryQueryTest {

    @Autowired
    private IRedemptionRepository repository;

    @Test
    void findDetailedByIdIsAValidDerivedQueryAndExecutes() {
        Optional<?> result = repository.findDetailedById("no-such-redemption");

        assertTrue(result.isEmpty());
    }
}
