package za.ac.cput.dealnest.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.repository.IPromotionRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Automatically activates promotions when their start date arrives and
 * deactivates them when their end date passes. Only promotions with
 * scheduleEnabled=true are managed (manual toggles are left alone otherwise).
 */
@Component
public class PromotionScheduler {

    private final IPromotionRepository repository;

    public PromotionScheduler(IPromotionRepository repository) {
        this.repository = repository;
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    public void applySchedule() {
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> promotions = repository.findAll();

        for (Promotion promotion : promotions) {
            if (!Boolean.TRUE.equals(promotion.getScheduleEnabled())) continue;

            boolean changed = false;
            LocalDateTime start = promotion.getStartDate();
            LocalDateTime end = promotion.getEndDate();

            if (start != null && end != null) {
                boolean inWindow = !now.isBefore(start) && now.isBefore(end);
                if (inWindow != Boolean.TRUE.equals(promotion.getActive())) {
                    promotion.setActive(inWindow);
                    changed = true;
                }
            } else if (end != null && Boolean.TRUE.equals(promotion.getActive()) && now.isAfter(end)) {
                promotion.setActive(false);
                changed = true;
            }

            if (changed) {
                repository.save(promotion);
            }
        }
    }
}