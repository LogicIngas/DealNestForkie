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

    public static Notification createPriorityNotification(String title, String message, User user) {
        Notification notification = createNotification(title, message, user);
        if (notification != null) {
            notification.setPriority(true);
        }
        return notification;
    }
}
