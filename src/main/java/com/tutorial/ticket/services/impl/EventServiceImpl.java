package com.tutorial.ticket.services.impl;

import com.tutorial.ticket.domain.CreateEventRequest;
import com.tutorial.ticket.domain.CreateTicketTypeRequest;
import com.tutorial.ticket.domain.entities.Event;
import com.tutorial.ticket.domain.entities.EventStatusEnum;
import com.tutorial.ticket.domain.entities.TicketType;
import com.tutorial.ticket.domain.entities.User;
import com.tutorial.ticket.repositories.EventRepository;
import com.tutorial.ticket.repositories.UserRepository;
import com.tutorial.ticket.services.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    // ----------------------------
    // Organizer (private/admin)
    // ----------------------------

    @Override
    @Transactional
    public Event createEvent(UUID organizerId, CreateEventRequest request) {

        User organizer = userRepository.findById(organizerId)
                .orElseThrow(() -> new IllegalArgumentException("Organizer not found: " + organizerId));

        Event event = Event.builder()
                .name(request.getName())
                .start(request.getStart())
                .end(request.getEnd())
                .venue(request.getVenue())
                .salesStart(request.getSalesStart())
                .salesEnd(request.getSalesEnd())
                .status(request.getStatus() != null ? request.getStatus() : EventStatusEnum.DRAFT)
                .organizer(organizer)
                .build();

        // Ensure ticketTypes list exists
        if (event.getTicketTypes() == null) {
            event.setTicketTypes(new ArrayList<>());
        }

        if (request.getTicketTypes() != null) {
            for (CreateTicketTypeRequest t : request.getTicketTypes()) {
                TicketType ticketType = TicketType.builder()
                        .name(t.getName())
                        .price(t.getPrice())
                        .description(t.getDescription())
                        .totalAvailable(t.getTotalAvailable())
                        .event(event)
                        .build();

                event.getTicketTypes().add(ticketType);
            }
        }

        return eventRepository.save(event);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Event> listEvents(UUID organizerId, Pageable pageable) {
        return eventRepository.findByOrganizer_Id(organizerId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Event getEvent(UUID organizerId, UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + eventId));

        UUID actualOrganizerId = (event.getOrganizer() != null) ? event.getOrganizer().getId() : null;
        if (actualOrganizerId == null || !actualOrganizerId.equals(organizerId)) {
            throw new IllegalArgumentException("Not allowed to access this event");
        }

        return event;
    }

    // ----------------------------
    // Public (published)
    // ----------------------------

    @Override
    @Transactional(readOnly = true)
    public Page<Event> listPublishedEvents(Pageable pageable) {
        return eventRepository.findByStatus(EventStatusEnum.PUBLISHED, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Event> searchPublishedEvents(String query, Pageable pageable) {
        String q = (query == null) ? "" : query.trim();
        if (q.isBlank()) {
            return listPublishedEvents(pageable);
        }

        return eventRepository.searchPublished(q, EventStatusEnum.PUBLISHED, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Event> getPublishedEvent(UUID eventId) {
        return eventRepository.findById(eventId)
                .filter(e -> e.getStatus() == EventStatusEnum.PUBLISHED);
    }
}
