package za.ac.cput.dealnest.service.impl;

import org.springframework.stereotype.Service;
import za.ac.cput.dealnest.domain.DealReport;
import za.ac.cput.dealnest.domain.DealReportStatus;
import za.ac.cput.dealnest.repository.IDealReportRepository;
import za.ac.cput.dealnest.service.IDealReportService;

import java.util.List;

@Service
public class DealReportServiceImpl implements IDealReportService {

    private final IDealReportRepository repository;

    public DealReportServiceImpl(IDealReportRepository repository) {
        this.repository = repository;
    }

    @Override
    public DealReport create(DealReport report) {
        return repository.save(report);
    }

    @Override
    public DealReport read(String reportId) {
        return repository.findDetailedById(reportId).orElse(null);
    }

    @Override
    public DealReport update(DealReport report) {
        return repository.save(report);
    }

    @Override
    public boolean delete(String reportId) {
        repository.deleteById(reportId);
        return true;
    }

    @Override
    public List<DealReport> findByPromotionId(String promotionId) {
        return repository.findByPromotion_PromotionID(promotionId);
    }

    @Override
    public List<DealReport> findByStatus(DealReportStatus status) {
        return repository.findByStatus(status);
    }

    @Override
    public List<DealReport> getAll() {
        return repository.findAll();
    }

    @Override
    public boolean hasAlreadyReported(String promotionId, String userId) {
        return repository.existsByPromotion_PromotionIDAndUser_UserID(promotionId, userId);
    }

    @Override
    public DealReport resolve(String reportId, DealReportStatus resolution) {
        DealReport report = repository.findById(reportId).orElse(null);
        if (report == null) {
            return null;
        }
        report.resolve(resolution);
        return repository.save(report);
    }
}
