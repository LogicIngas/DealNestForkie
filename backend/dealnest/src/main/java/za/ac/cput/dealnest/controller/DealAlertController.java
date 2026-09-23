package za.ac.cput.dealnest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.DealAlert;
import za.ac.cput.dealnest.service.IDealAlertService;

import java.util.List;

@RestController
@RequestMapping("/api/dealAlert")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class DealAlertController {

    private final IDealAlertService dealAlertService;

    @Autowired
    public DealAlertController(IDealAlertService dealAlertService) {
        this.dealAlertService = dealAlertService;
    }

    @PostMapping("/create")
    public ResponseEntity<DealAlert> create(@RequestBody DealAlert dealAlert) {
        DealAlert saved = dealAlertService.create(dealAlert);
        if (saved == null) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).build();
        }
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/read/{alertId}")
    public DealAlert read(@PathVariable String alertId) {
        return dealAlertService.read(alertId);
    }

    @PutMapping("/update/{alertId}")
    public DealAlert update(@PathVariable String alertId, @RequestBody DealAlert dealAlert) {
        return dealAlertService.update(dealAlert);
    }

    @DeleteMapping("/delete/{alertId}")
    public boolean delete(@PathVariable String alertId) {
        return dealAlertService.delete(alertId);
    }

    @GetMapping("/findByUserId/{userId}")
    public List<DealAlert> findByUserId(@PathVariable String userId) {
        return dealAlertService.findByUserId(userId);
    }

    @GetMapping("/getAll")
    public List<DealAlert> getAll() {
        return dealAlertService.findActive();
    }
}