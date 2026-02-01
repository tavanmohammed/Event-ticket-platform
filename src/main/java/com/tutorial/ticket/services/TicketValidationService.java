package com.tutorial.ticket.services;

import com.tutorial.ticket.domain.entities.TicketValidation;
import java.util.UUID;

public interface TicketValidationService {
    TicketValidation validateTicketByQrCode(UUID qrCodeId);
    TicketValidation validateTicketManually(UUID ticketId);
}
