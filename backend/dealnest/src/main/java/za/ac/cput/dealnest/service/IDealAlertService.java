package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.DealAlert;

import java.util.List;

public interface IDealAlertService {
    DealAlert create(DealAlert dealAlert);

    DealAlert read(String dealAlertId);

    DealAlert update(DealAlert dealAlert);

    boolean delete(String dealAlertId);

    List<DealAlert> findByUserId(String userId);

    List<DealAlert> findActive();
}