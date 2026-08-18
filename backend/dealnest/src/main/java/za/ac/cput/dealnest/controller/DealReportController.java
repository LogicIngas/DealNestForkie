package za.ac.cput.dealnest.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.dealnest.domain.DealReport;
import za.ac.cput.dealnest.domain.DealReportStatus;
import za.ac.cput.dealnest.factory.DealReportFactory;
import za.ac.cput.dealnest.service.IDealReportService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dealReport")
@CrossOrigin(origins = "${cors.allowed.origin:http://localhost:5173}")
public class DealReportController {

    private final IDealReportService reportService;

    public DealReportController(IDealReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody DealReport report) {
        if (report.getPromotion() == null || report.getUser() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "A deal and a reporting user are required."));
        }
        if (reportService.hasAlreadyReported(report.getPromotion().getPromotionID(), report.getUser().getUserID())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "You've already reported this deal."));
        }

        DealReport built = DealReportFactory.createReport(report.getReason(), report.getDetails(), report.getPromotion(), report.getUser());
        if (built == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid report — please choose a reason."));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.create(built));
    }

    @GetMapping("/findByPromotionId/{promotionId}")
    public List<DealReport> findByPromotionId(@PathVariable String promotionId) {
        return reportService.findByPromotionId(promotionId);
    }

    @GetMapping("/findByStatus/{status}")
    public ResponseEntity<?> findByStatus(@PathVariable String status) {
        try {
            return ResponseEntity.ok(reportService.findByStatus(DealReportStatus.valueOf(status.toUpperCase())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Unknown status: " + status));
        }
    }

    @GetMapping("/getAll")
    public List<DealReport> getAll() {
        return reportService.getAll();
    }

    @PutMapping("/resolve/{reportId}")
    public ResponseEntity<?> resolve(@PathVariable String reportId, @RequestBody Map<String, String> body) {
        DealReportStatus resolution;
        try {
            resolution = DealReportStatus.valueOf(body.getOrDefault("status", "").toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status must be REVIEWED or DISMISSED."));
        }
        DealReport resolved = reportService.resolve(reportId, resolution);
        if (resolved == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Report not found."));
        }
        return ResponseEntity.ok(resolved);
    }
}
