package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.Notification;
import za.ac.cput.dealnest.repository.INotificationRepository;
import za.ac.cput.dealnest.service.INotificationService;

import java.util.List;

@Service
public class NotificationServiceImpl implements INotificationService {

    private final INotificationRepository repository;

    public NotificationServiceImpl(INotificationRepository repository) {
        this.repository = repository;
    }

    @Override
    public Notification create(Notification notification) {
        return repository.save(notification);
    }

    @Override
    public Notification read(String notificationId) {
        return repository.findById(notificationId).orElse(null);
    }

    @Override
    public Notification update(Notification notification) {
        return repository.save(notification);
    }

    @Override
    public boolean delete(String notificationId) {
        repository.deleteById(notificationId);
        return true;
    }

    @Override
    public List<Notification> findByUserId(String userId) {
        return repository.findByUser_UserID(userId);
    }

    @Override
    public List<Notification> findUnreadByUserId(String userId) {
        return repository.findByUser_UserIDAndIsReadFalse(userId);
    }

    @Override
    public List<Notification> getAll() {
        return repository.findAll();
    }
}
