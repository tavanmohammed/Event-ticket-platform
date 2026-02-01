package com.tutorial.ticket.services;

import com.tutorial.ticket.domain.entities.Ticket;
import java.util.UUID;

public interface TicketTypeService {
    Ticket purchaseTicket(UUID userId, UUID ticketTypeId);
}
