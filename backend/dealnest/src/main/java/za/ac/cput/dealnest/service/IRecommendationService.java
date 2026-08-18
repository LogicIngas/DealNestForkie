package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.Store;

import java.util.List;

public interface IRecommendationService {
    List<Store> getRecommendedForUser(String userId);
}
