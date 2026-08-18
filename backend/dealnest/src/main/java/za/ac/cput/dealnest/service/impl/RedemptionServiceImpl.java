package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.Redemption;
import za.ac.cput.dealnest.factory.RedemptionFactory;
import za.ac.cput.dealnest.repository.IRedemptionRepository;
import za.ac.cput.dealnest.service.IRedemptionService;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RedemptionServiceImpl implements IRedemptionService {

    private final IRedemptionRepository repository;

    public RedemptionServiceImpl(IRedemptionRepository repository) {
        this.repository = repository;
    }

    @Override
    public Redemption claim(Redemption redemption) {
        // The code and redeemed status are always decided here, never trusted
        // from the client's request body.
        String code = RedemptionFactory.generateCode();
        int attempts = 0;
        while (repository.existsByCode(code) && attempts < 5) {
            code = RedemptionFactory.generateCode();
            attempts++;
        }
        redemption.setCode(code);
        redemption.setRedeemed(false);
        return repository.save(redemption);
    }

    @Override
    public Redemption redeem(String code, String storeId) {
        Redemption redemption = repository.findByCode(code).orElse(null);
        if (redemption == null || redemption.getPromotion() == null || redemption.getPromotion().getStore() == null) {
            return null;
        }
        if (!redemption.getPromotion().getStore().getStoreId().equals(storeId)) {
            return null;
        }
        if (Boolean.TRUE.equals(redemption.getRedeemed())) {
            return null;
        }
        redemption.setRedeemed(true);
        redemption.setRedeemedAt(LocalDateTime.now());
        return repository.save(redemption);
    }

    @Override
    public List<Redemption> findByUserId(String userId) {
        return repository.findByUser_UserID(userId);
    }
}
