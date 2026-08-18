package za.ac.cput.dealnest.service;

import za.ac.cput.dealnest.domain.DealReport;
import za.ac.cput.dealnest.domain.DealReportStatus;

import java.util.List;

public interface IDealReportService extends IService<DealReport, String> {
    List<DealReport> findByPromotionId(String promotionId);
    List<DealReport> findByStatus(DealReportStatus status);
    List<DealReport> getAll();
    boolean hasAlreadyReported(String promotionId, String userId);
    DealReport resolve(String reportId, DealReportStatus resolution);
}
