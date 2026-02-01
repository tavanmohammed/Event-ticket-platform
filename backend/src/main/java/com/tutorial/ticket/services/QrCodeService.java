package com.tutorial.ticket.services;

import com.tutorial.ticket.domain.entities.QrCode;
import com.tutorial.ticket.domain.entities.Ticket;
import java.util.UUID;

public interface QrCodeService {

    QrCode generateQrCode(Ticket ticket);

    byte[] getQrCodeImageForUserAndTicket(UUID userId, UUID ticketId);
}
