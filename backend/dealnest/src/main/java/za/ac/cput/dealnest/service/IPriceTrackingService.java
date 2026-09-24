package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.PricePoint;
import za.ac.cput.dealnest.domain.Promotion;

import java.util.List;

public interface IPriceTrackingService {
    void recordIfChanged(Double previousPrice, Promotion updated);
    List<PricePoint> findByPromotionId(String promotionId);
}
