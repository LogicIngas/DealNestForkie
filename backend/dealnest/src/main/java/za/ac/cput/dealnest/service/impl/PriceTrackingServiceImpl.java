package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.PricePoint;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.repository.IPricePointRepository;
import za.ac.cput.dealnest.service.IPriceTrackingService;

import java.util.List;
import java.util.Objects;

@Service
public class PriceTrackingServiceImpl implements IPriceTrackingService {

    private final IPricePointRepository repository;

    public PriceTrackingServiceImpl(IPricePointRepository repository) {
        this.repository = repository;
    }

    @Override
    public void recordIfChanged(Double previousPrice, Promotion updated) {
        if (updated == null || updated.getDiscountPrice() == null) return;
        // Compare raw values instead of the previous Promotion: repository.save()
        // on an id-bearing entity merges onto the instance already loaded into the
        // persistence context, so a "previous" Promotion would alias the updated
        // one and always look unchanged.
        boolean changed = previousPrice == null || !Objects.equals(previousPrice, updated.getDiscountPrice());
        if (!changed) return;

        PricePoint point = new PricePoint.Builder()
                .setPrice(updated.getDiscountPrice())
                .setPromotion(updated)
                .build();
        repository.save(point);
    }

    @Override
    public List<PricePoint> findByPromotionId(String promotionId) {
        return repository.findByPromotion_PromotionIDOrderByRecordedAtAsc(promotionId);
    }
}
