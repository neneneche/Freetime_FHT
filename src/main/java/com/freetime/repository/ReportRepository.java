package com.freetime.repository;

import com.freetime.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByStatus(String status);
    long countByTargetTypeAndTargetId(String targetType, Long targetId);
}