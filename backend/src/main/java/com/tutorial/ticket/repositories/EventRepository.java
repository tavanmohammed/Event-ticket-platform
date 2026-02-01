package com.tutorial.ticket.repositories;

import com.tutorial.ticket.domain.entities.Event;
import com.tutorial.ticket.domain.entities.EventStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {

    Page<Event> findByOrganizer_Id(UUID organizerId, Pageable pageable);

    Page<Event> findByStatus(EventStatusEnum status, Pageable pageable);

    @Query("""
        SELECT e
        FROM Event e
        WHERE e.status = :status
          AND (
                LOWER(e.name) LIKE LOWER(CONCAT('%', :q, '%'))
             OR LOWER(e.venue) LIKE LOWER(CONCAT('%', :q, '%'))
          )
    """)
    Page<Event> searchPublished(
            @Param("q") String q,
            @Param("status") EventStatusEnum status,
            Pageable pageable
    );
}
