package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.Notification;
import za.ac.cput.dealnest.service.INotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/notification")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class NotificationController {

    private final INotificationService notificationService;

    @Autowired
    public NotificationController(INotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/create")
    public Notification create(@RequestBody Notification notification) {
        return notificationService.create(notification);
    }

    @GetMapping("/read/{notificationId}")
    public Notification read(@PathVariable String notificationId) {
        return notificationService.read(notificationId);
    }

    @PutMapping("/update/{notificationId}")
    public Notification update(@PathVariable String notificationId,@RequestBody Notification notification) {
        return notificationService.update(notification);
    }

    @DeleteMapping("/delete/{notificationId}")
    public boolean delete(@PathVariable String notificationId) {
        notificationService.delete(notificationId);
        return true;
    }

    @GetMapping("/findByUserId/{userId}")
    public List<Notification> findByUserId(@PathVariable String userId) {
        return notificationService.findByUserId(userId);
    }

    @GetMapping("/findUnreadByUserId/{userId}")
    public List<Notification> findUnreadByUserId(@PathVariable String userId) {
        return notificationService.findUnreadByUserId(userId);
    }

    @GetMapping("/getAll")
    public List<Notification> getAll() {
        return notificationService.getAll();
    }
}
