package za.ac.cput.dealnest.factory;

import za.ac.cput.dealnest.domain.SearchHistory;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.util.Helper;

public class SearchHistoryFactory {

    public static SearchHistory createSearchHistory(String searchQuery, User user) {
        if (Helper.isNullOrEmpty(searchQuery) || user == null) {
            return null;
        }

        return new SearchHistory.Builder()
                .setSearchQuery(searchQuery)
                .setUser(user)
                .build();
    }
}
