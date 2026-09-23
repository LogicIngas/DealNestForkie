package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.AnalyticsEventType;

import java.util.Map;

public interface IAnalyticsService {
    void recordEvent(AnalyticsEventType type, String userId, String storeId, String promotionId);

    Map<String, Object> getStoreAnalytics(String storeId);

    Map<String, Object> getCustomerInsights(String storeId);
}