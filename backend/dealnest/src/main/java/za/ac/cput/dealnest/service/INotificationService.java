package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.Notification;
import java.util.List;

public interface INotificationService extends IService<Notification, String> {
    List<Notification> findByUserId(String userId);
    List<Notification> findUnreadByUserId(String userId);
    List<Notification> getAll();
}
