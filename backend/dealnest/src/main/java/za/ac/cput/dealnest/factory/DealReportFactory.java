package za.ac.cput.dealnest.factory;

import za.ac.cput.dealnest.domain.DealReport;
import za.ac.cput.dealnest.domain.DealReportReason;
import za.ac.cput.dealnest.domain.DealReportStatus;
import za.ac.cput.dealnest.domain.Promotion;
import za.ac.cput.dealnest.domain.User;
import za.ac.cput.dealnest.util.Helper;

public class DealReportFactory {

    private static final int MAX_DETAILS_LENGTH = 500;

    public static DealReport createReport(DealReportReason reason, String details, Promotion promotion, User user) {
        if (reason == null || promotion == null || user == null) {
            return null;
        }
        if (details != null && !details.isEmpty() && !Helper.isValidLength(details, MAX_DETAILS_LENGTH)) {
            return null;
        }

        return new DealReport.Builder()
                .setReason(reason)
                .setDetails(details)
                .setStatus(DealReportStatus.PENDING)
                .setPromotion(promotion)
                .setUser(user)
                .build();
    }
}
