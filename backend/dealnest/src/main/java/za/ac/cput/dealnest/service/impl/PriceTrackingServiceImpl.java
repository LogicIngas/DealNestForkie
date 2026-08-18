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
    public void recordIfChanged(Promotion previous, Promotion updated) {
        if (updated == null || updated.getDiscountPrice() == null) return;
        boolean changed = previous == null || !Objects.equals(previous.getDiscountPrice(), updated.getDiscountPrice());
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
