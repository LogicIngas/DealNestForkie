package za.ac.cput.dealnest.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import za.ac.cput.dealnest.service.EmailNotificationSender;

import static org.assertj.core.api.Assertions.assertThat;

class EmailNotificationSenderWiringTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(BrevoEmailNotificationSender.class, ResendEmailNotificationSender.class, SmtpEmailNotificationSender.class);

    @Test
    void brevoIsTheOnlySenderByDefault() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context.getBeanNamesForType(EmailNotificationSender.class)).hasSize(1);
            assertThat(context.getBean(EmailNotificationSender.class))
                    .isInstanceOf(BrevoEmailNotificationSender.class);
        });
    }

    @Test
    void selectingResendReplacesTheSender() {
        runner.withPropertyValues("notifications.email.provider=resend")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context.getBeanNamesForType(EmailNotificationSender.class)).hasSize(1);
                    assertThat(context.getBean(EmailNotificationSender.class))
                            .isInstanceOf(ResendEmailNotificationSender.class);
                });
    }

    @Test
    void selectingSmtpReplacesTheSender() {
        runner.withPropertyValues("notifications.email.provider=smtp")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context.getBeanNamesForType(EmailNotificationSender.class)).hasSize(1);
                    assertThat(context.getBean(EmailNotificationSender.class))
                            .isInstanceOf(SmtpEmailNotificationSender.class);
                });
    }

    @Test
    void selectingBrevoExplicitlyKeepsExactlyOneSender() {
        runner.withPropertyValues("notifications.email.provider=brevo")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context.getBeanNamesForType(EmailNotificationSender.class))
                            .hasSize(1);
                });
    }

    @Test
    void senderIsNotConfiguredUntilCredentialsAreSupplied() {
        runner.run(context -> assertThat(context.getBean(EmailNotificationSender.class).isConfigured()).isFalse());

        runner.withPropertyValues(
                        "notifications.brevo.api-key=xkeysib-secret",
                        "notifications.brevo.from=dealnest@brevo.com")
                .run(context -> assertThat(context.getBean(EmailNotificationSender.class).isConfigured()).isTrue());
    }

    @Test
    void smtpSenderIsNotConfiguredUntilCredentialsAreSupplied() {
        runner.withPropertyValues("notifications.email.provider=smtp")
                .run(context -> assertThat(context.getBean(EmailNotificationSender.class).isConfigured()).isFalse());

        runner.withPropertyValues(
                        "notifications.email.provider=smtp",
                        "spring.mail.host=smtp.gmail.com",
                        "spring.mail.username=dealnest@gmail.com",
                        "spring.mail.password=supersecretapppw")
                .run(context -> assertThat(context.getBean(EmailNotificationSender.class).isConfigured()).isTrue());
    }
}
