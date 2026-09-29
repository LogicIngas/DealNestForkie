package za.ac.cput.dealnest.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.cput.dealnest.domain.Notification;
import java.util.List;
import java.util.Optional;

public interface INotificationRepository extends JpaRepository<Notification, String> {

    /**
     * The owner comes back with every notification.
     *
     * <p>A Notification is serialised with its {@code user} field and that is a lazy
     * to-one, so listing them without the join cost one extra query per row. Every join
     * here is to-one, so the join cannot duplicate rows.
     */
    @Query("select n from Notification n join fetch n.user where n.user.userID = :userID")
    List<Notification> findByUser_UserID(String userID);

    /** The bell-icon poll. Owner pre-fetched, and served by idx_notifications_user_unread. */
    @Query("select n from Notification n join fetch n.user "
            + "where n.user.userID = :userID and n.isRead = false")
    List<Notification> findByUser_UserIDAndIsReadFalse(String userID);

    @Query("select n from Notification n join fetch n.user where n.notificationID = :notificationID")
    Optional<Notification> findDetailedById(@Param("notificationID") String notificationID);
}
