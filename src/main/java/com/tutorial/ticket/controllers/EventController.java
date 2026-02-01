package com.tutorial.ticket.controllers;

import com.tutorial.ticket.domain.CreateEventRequest;
import com.tutorial.ticket.domain.dtos.CreateEventRequestDto;
import com.tutorial.ticket.domain.dtos.CreateEventResponseDto;
import com.tutorial.ticket.domain.entities.Event;
import com.tutorial.ticket.mappers.EventMapper;
import com.tutorial.ticket.services.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventMapper eventMapper;
    private final EventService eventService;

    // ✅ CREATE EVENT (POST /api/v1/events)
    @PostMapping
    public ResponseEntity<CreateEventResponseDto> createEvent(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateEventRequestDto createEventRequestDto
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());

        CreateEventRequest createEventRequest =
                eventMapper.toCreateEventRequest(createEventRequestDto);

        Event createdEvent = eventService.createEvent(userId, createEventRequest);

        CreateEventResponseDto createEventResponseDto =
                eventMapper.toDto(createdEvent);

        return new ResponseEntity<>(createEventResponseDto, HttpStatus.CREATED);
    }

    // ✅ LIST EVENTS (GET /api/v1/events?page=0&size=2)
    @GetMapping
    public ResponseEntity<Page<Event>> listEvents(
            @AuthenticationPrincipal Jwt jwt,
            Pageable pageable
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        Page<Event> events = eventService.listEvents(userId, pageable);
        return ResponseEntity.ok(events);
    }

    // ✅ GET SINGLE EVENT (GET /api/v1/events/{id})
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEvent(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id
    ) {
        UUID userId = UUID.fromString(jwt.getSubject());
        Event event = eventService.getEvent(userId, id);
        return ResponseEntity.ok(event);
    }
}
