package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.Promotion;
import java.util.List;

public interface IPromotionService extends IService<Promotion, String> {
    List<Promotion> findByStoreId(String storeId);
    List<Promotion> findByIsActiveTrue();
    List<Promotion> getAll();
}
