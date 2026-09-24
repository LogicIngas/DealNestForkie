package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.DealAlert;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.UserPlanTier;
import za.ac.cput.dealnest.repository.IDealAlertRepository;
import za.ac.cput.dealnest.service.IDealAlertService;
import za.ac.cput.dealnest.service.IUserService;

import java.util.List;

@Service
public class DealAlertServiceImpl implements IDealAlertService {

    private final IDealAlertRepository repository;
    private final IUserService userService;

    public DealAlertServiceImpl(IDealAlertRepository repository, IUserService userService) {
        this.repository = repository;
        this.userService = userService;
    }

    @Override
    public DealAlert create(DealAlert dealAlert) {
        if (dealAlert.getUser() != null) {
            User user = userService.read(dealAlert.getUser().getUserID());
            if (user == null || user.getPlanTier() != UserPlanTier.PLUS) {
                return null;
            }
        }
        return repository.save(dealAlert);
    }

    @Override
    public DealAlert read(String dealAlertId) {
        return repository.findById(dealAlertId).orElse(null);
    }

    @Override
    public DealAlert update(DealAlert dealAlert) {
        return repository.save(dealAlert);
    }

    @Override
    public boolean delete(String dealAlertId) {
        repository.deleteById(dealAlertId);
        return true;
    }

    @Override
    public List<DealAlert> findByUserId(String userId) {
        return repository.findByUser_UserID(userId);
    }

    @Override
    public List<DealAlert> findActive() {
        // Only currently-active Plus subscribers get their alerts fired.
        return repository.findByActiveTrueAndUser_PlanTier(UserPlanTier.PLUS);
    }
}