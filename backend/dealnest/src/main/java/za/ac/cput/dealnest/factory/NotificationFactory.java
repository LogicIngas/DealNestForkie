package za.ac.cput.dealnest.factory;

import za.ac.cput.dealnest.domain.Notification;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.util.Helper;

public class NotificationFactory {

    public static Notification createNotification(String title, String message, User user) {
        if (Helper.isNullOrEmpty(title) || Helper.isNullOrEmpty(message) || user == null) {
            return null;
        }

        return new Notification.Builder()
                .setTitle(title)
                .setMessage(message)
                .setUser(user)
                .setRead(false)
                .build();
    }
}
