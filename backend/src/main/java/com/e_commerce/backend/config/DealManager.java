package com.e_commerce.backend.config;

import com.e_commerce.backend.catalog.Product;
import com.e_commerce.backend.catalog.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Keeps the "Today's Deals" page populated for the demo: expired deals are cleared and
 * new time-limited deals are rotated in so there are always about {@value #TARGET_DEALS} live deals.
 */
@Component
public class DealManager {

    private static final Logger log = LoggerFactory.getLogger(DealManager.class);
    static final int TARGET_DEALS = 30;
    private static final int[] DEAL_PERCENTS = {10, 15, 20, 25, 30, 35, 40};

    private final ProductRepository products;

    public DealManager(ProductRepository products) {
        this.products = products;
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void refreshDeals() {
        Instant now = Instant.now();
        List<Product> expired = products.findExpiredDeals(now);
        expired.forEach(p -> {
            p.setDealPercent(null);
            p.setDealEndsAt(null);
        });

        long missing = TARGET_DEALS - products.countActiveDeals(now);
        if (missing <= 0) {
            return;
        }
        List<Product> candidates = new ArrayList<>(products.findDealCandidates(PageRequest.of(0, 500)));
        Collections.shuffle(candidates);
        ThreadLocalRandom random = ThreadLocalRandom.current();
        candidates.stream().limit(missing).forEach(p -> {
            p.setDealPercent(DEAL_PERCENTS[random.nextInt(DEAL_PERCENTS.length)]);
            p.setDealEndsAt(now.plus(Duration.ofHours(random.nextInt(4, 72))).plus(Duration.ofMinutes(random.nextInt(60))));
        });
        log.info("Deals refreshed: {} expired, {} new", expired.size(), Math.min(missing, candidates.size()));
    }
}
