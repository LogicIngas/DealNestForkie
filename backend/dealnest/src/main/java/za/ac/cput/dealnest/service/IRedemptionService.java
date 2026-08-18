package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.Redemption;

import java.util.List;

public interface IRedemptionService {
    Redemption claim(Redemption redemption);
    Redemption redeem(String code, String storeId);
    List<Redemption> findByUserId(String userId);
}
