package za.ac.cput.dealnest.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class BrevoEmailNotificationSenderTest {

    private static final String CLAIM_77 = "voucher-claim:77:email";
    private static final String CLAIM_78 = "voucher-claim:78:email";

    private MockRestServiceServer server;
    private BrevoEmailNotificationSender sender;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.brevo.com");
        server = MockRestServiceServer.bindTo(builder).build();
        sender = new BrevoEmailNotificationSender(builder.build());
    }

    @Test
    void isNotConfiguredWithoutApiKeyOrSender() {
        ReflectionTestUtils.setField(sender, "apiKey", "");
        ReflectionTestUtils.setField(sender, "from", "dealnest@brevo.com");
        assertThat(sender.isConfigured()).isFalse();

        ReflectionTestUtils.setField(sender, "apiKey", "xkeysib-secret");
        ReflectionTestUtils.setField(sender, "from", "  ");
        assertThat(sender.isConfigured()).isFalse();

        ReflectionTestUtils.setField(sender, "from", "dealnest@brevo.com");
        assertThat(sender.isConfigured()).isTrue();
    }

    @Test
    void sendsVoucherEmailToTheClaimersOwnAddress() {
        configureSender();

        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("api-key", "xkeysib-secret"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.sender.email").value("dealnest@brevo.com"))
                .andExpect(jsonPath("$.sender.name").value("DealNest"))
                .andExpect(jsonPath("$.to[0].email").value("claimer@example.com"))
                .andExpect(jsonPath("$.subject").value("Your DealNest voucher"))
                .andExpect(jsonPath("$.textContent").value("Code: DEAL-123"))
                .andExpect(jsonPath("$.tags[0]").value("voucher-claim"))
                .andRespond(withSuccess("{\"messageId\":\"<abc@relay.brevo.com>\"}", MediaType.APPLICATION_JSON));

        sender.send("claimer@example.com", "Your DealNest voucher", "Code: DEAL-123", CLAIM_77);

        server.verify();
    }

    @Test
    void sendsToAnyRecipientRatherThanAFixedTester() {
        configureSender();

        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(jsonPath("$.to[0].email").value("first.tester@example.com"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(jsonPath("$.to[0].email").value("second.tester@example.com"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        sender.send("first.tester@example.com", "Subject", "Body", CLAIM_77);
        sender.send("second.tester@example.com", "Subject", "Body", CLAIM_78);

        server.verify();
    }

    @Test
    void derivesStableDistinctUuidIdempotencyKeysPerClaim() {
        configureSender();

        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(header("Idempotency-Key", "eb21a077-9513-3651-9324-78a07686946b"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(header("Idempotency-Key", "7e90996e-bef8-30de-8e23-4d79ad4e7436"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(header("Idempotency-Key", "eb21a077-9513-3651-9324-78a07686946b"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        sender.send("claimer@example.com", "Subject", "Body", CLAIM_77);
        sender.send("claimer@example.com", "Subject", "Body", CLAIM_78);
        sender.send("claimer@example.com", "Subject", "Body", CLAIM_77);

        server.verify();
    }

    @Test
    void omitsIdempotencyHeaderWhenNoKeyIsProvided() {
        configureSender();

        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(request -> assertThat(request.getHeaders().getFirst("Idempotency-Key")).isNull())
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        sender.send("claimer@example.com", "Subject", "Body", null);

        server.verify();
    }

    @Test
    void sendsTextOnlyWhenNoHtmlBodyIsSupplied() {
        configureSender();

        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(jsonPath("$.htmlContent").doesNotExist())
                .andExpect(jsonPath("$.templateId").doesNotExist())
                .andExpect(jsonPath("$.textContent").exists())
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        sender.send("claimer@example.com", "Subject", "Plain body", CLAIM_77);

        server.verify();
    }

    @Test
    void sendsBothBodiesSoHtmlClientsGetTheStyledVoucher() {
        configureSender();

        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(jsonPath("$.textContent").value("Plain body"))
                .andExpect(jsonPath("$.htmlContent").value("<p>Styled</p>"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        sender.send("claimer@example.com", "Subject", "Plain body", "<p>Styled</p>", CLAIM_77);

        server.verify();
    }

    @Test
    void fallsBackToDealNestWhenSenderNameIsBlank() {
        configureSender();
        ReflectionTestUtils.setField(sender, "fromName", "  ");

        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(jsonPath("$.sender.name").value("DealNest"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        sender.send("claimer@example.com", "Subject", "Body", CLAIM_77);

        server.verify();
    }

    @Test
    void propagatesProviderFailuresSoClaimStillSucceeds() {
        configureSender();

        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andRespond(withStatus(HttpStatus.BAD_REQUEST)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"code\":\"invalid_parameter\",\"message\":\"bad sender\"}"));

        assertThat(catchThrowable(() -> sender.send("claimer@example.com", "Subject", "Body", CLAIM_77)))
                .isNotNull();
    }

    private void configureSender() {
        ReflectionTestUtils.setField(sender, "apiKey", "xkeysib-secret");
        ReflectionTestUtils.setField(sender, "from", "dealnest@brevo.com");
        ReflectionTestUtils.setField(sender, "fromName", "DealNest");
    }
}
