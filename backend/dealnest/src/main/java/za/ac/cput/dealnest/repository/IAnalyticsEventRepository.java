package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.AnalyticsEvent;
import za.ac.cput.dealnest.domain.AnalyticsEventType;

import java.util.List;

public interface IAnalyticsEventRepository extends JpaRepository<AnalyticsEvent, String> {
    long countByStore_StoreId(String storeId);

    long countByStore_StoreIdAndEventType(String storeId, AnalyticsEventType eventType);

    long countByPromotion_PromotionIDAndEventType(String promotionId, AnalyticsEventType eventType);

    List<AnalyticsEvent> findByStore_StoreId(String storeId);

    List<AnalyticsEvent> findByStore_StoreIdAndEventType(String storeId, AnalyticsEventType eventType);
}