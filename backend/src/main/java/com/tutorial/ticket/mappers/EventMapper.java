package com.tutorial.ticket.mappers;

import com.tutorial.ticket.domain.CreateEventRequest;
import com.tutorial.ticket.domain.dtos.CreateEventRequestDto;
import com.tutorial.ticket.domain.dtos.CreateEventResponseDto;
import com.tutorial.ticket.domain.dtos.GetPublishedEventDetailsResponseDto;
import com.tutorial.ticket.domain.dtos.ListPublishedEventResponseDto;
import com.tutorial.ticket.domain.entities.Event;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface EventMapper {

    ListPublishedEventResponseDto toListPublishedEventResponseDto(Event event);

    GetPublishedEventDetailsResponseDto toGetPublishedEventDetailsResponseDto(Event event);
    // DTO → Domain
    CreateEventRequest toCreateEventRequest(CreateEventRequestDto dto);

    // Entity → DTO
    CreateEventResponseDto toDto(Event event);
}
