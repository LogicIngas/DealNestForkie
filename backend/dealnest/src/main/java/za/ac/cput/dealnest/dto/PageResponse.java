package za.ac.cput.dealnest.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * One page of results, in the shape a "load more" list needs.
 *
 * <p>Spring's own {@code Page} would serialise, but its JSON is explicitly documented
 * as unstable across Spring Data versions, and it carries a chunk of fields this API has
 * no use for. This sends only what the client acts on: the rows, and whether asking for
 * the next page would return anything.
 *
 * <p>{@code last} is what drives the button. The client is not asked to compare
 * {@code content.size()} against {@code size} itself, which is wrong the moment a
 * shopper is looking at the last, short page.
 *
 * @param content       the rows on this page, already in the order the query asked for
 * @param page          zero-based index of this page
 * @param size          the page size that was requested
 * @param totalElements how many rows match in total, for "showing 24 of 310"
 * @param last          true when this is the final page
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        boolean last) {

    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.isLast());
    }
}
