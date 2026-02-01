package com.tutorial.ticket.services;

import com.tutorial.ticket.domain.CreateEventRequest;
import com.tutorial.ticket.domain.entities.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface EventService {

    // Organizer (private/admin) endpoints
    Event createEvent(UUID organizerId, CreateEventRequest request);

    Page<Event> listEvents(UUID organizerId, Pageable pageable);

    Event getEvent(UUID organizerId, UUID eventId);

    // Public (published) endpoints
    Page<Event> listPublishedEvents(Pageable pageable);

    Page<Event> searchPublishedEvents(String query, Pageable pageable);

    Optional<Event> getPublishedEvent(UUID eventId);
}
