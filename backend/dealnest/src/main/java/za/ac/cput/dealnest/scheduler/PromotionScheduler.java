package za.ac.cput.dealnest.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.repository.IPromotionRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    @Transactional
    public void applySchedule() {
        LocalDateTime now = LocalDateTime.now();

        // Four scalars per opted-in deal, no managed entities. This used to be
        // findAll() over the whole promotions table, which put every row in the session
        // and held one of the pool's five connections for a full minute-cycle at a
        // time. Deciding which deals to flip happens here, against the scalar rows, so
        // a tick where nothing has come due never writes and never loads an entity.
        List<String> toActivate = new ArrayList<>();
        List<String> toDeactivate = new ArrayList<>();

        for (Object[] row : repository.findScheduleState()) {
            String promotionID = (String) row[0];
            LocalDateTime start = (LocalDateTime) row[1];
            LocalDateTime end = (LocalDateTime) row[2];
            Boolean active = (Boolean) row[3];

            if (start != null && end != null) {
                boolean inWindow = !now.isBefore(start) && now.isBefore(end);
                if (inWindow && !Boolean.TRUE.equals(active)) {
                    toActivate.add(promotionID);
                } else if (!inWindow && Boolean.TRUE.equals(active)) {
                    toDeactivate.add(promotionID);
                }
            } else if (end != null && Boolean.TRUE.equals(active) && now.isAfter(end)) {
                toDeactivate.add(promotionID);
            }
        }

        if (toActivate.isEmpty() && toDeactivate.isEmpty()) {
            return;
        }

        // Only the deals whose window actually opened or closed are loaded and saved,
        // instead of every deal in the table.
        for (String promotionID : toActivate) {
            repository.findById(promotionID).ifPresent(promotion -> {
                promotion.setActive(true);
                repository.save(promotion);
            });
        }
        for (String promotionID : toDeactivate) {
            repository.findById(promotionID).ifPresent(promotion -> {
                promotion.setActive(false);
                repository.save(promotion);
            });
        }
    }
}
