package za.ac.cput.dealnest.factory;

import za.ac.cput.dealnest.domain.FavoriteStore;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.domain.Store;

public class FavoriteStoreFactory {

    public static FavoriteStore createFavoriteStore(User user, Store store) {
        if (user == null || store == null) {
            return null;
        }

        return new FavoriteStore.Builder()
                .setUser(user)
                .setStore(store)
                .build();
    }
}
