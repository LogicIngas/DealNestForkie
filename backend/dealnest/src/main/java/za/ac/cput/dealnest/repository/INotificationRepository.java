package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.dealnest.domain.Notification;
import java.util.List;

public interface INotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUser_UserID(String userID);
    List<Notification> findByUser_UserIDAndIsReadFalse(String userID);
}
