package com.tutorial.ticket.services.impl;

import com.tutorial.ticket.exceptions.TicketsSoldOutException;
import com.tutorial.ticket.exceptions.UserNotFoundException;
import com.tutorial.ticket.repositories.TicketRepository;
import com.tutorial.ticket.repositories.TicketTypeRepository;
import com.tutorial.ticket.services.QrCodeService;
import com.tutorial.ticket.services.TicketTypeService;
import com.tutorial.ticket.exceptions.TicketTypeNotFoundException;
import com.tutorial.ticket.repositories.UserRepository;
import com.tutorial.ticket.domain.entities.Ticket;
import com.tutorial.ticket.domain.entities.TicketStatusEnum;
import com.tutorial.ticket.domain.entities.TicketType;
import com.tutorial.ticket.domain.entities.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketTypeServiceImpl implements TicketTypeService {

    private final UserRepository userRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final TicketRepository ticketRepository;
    private final QrCodeService qrCodeService;

    @Override
    @Transactional
    public Ticket purchaseTicket(UUID userId, UUID ticketTypeId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(
                String.format("User with ID %s was not found", userId)
        ));

        TicketType ticketType = ticketTypeRepository.findByIdWithLock(ticketTypeId)
                .orElseThrow(() -> new TicketTypeNotFoundException(
                        String.format("Ticket type with ID %s was not found", ticketTypeId)
                ));

        int purchasedTickets = ticketRepository.countByTicketTypeId(ticketType.getId());
        Integer totalAvailable = ticketType.getTotalAvailable();

        if(purchasedTickets + 1 > totalAvailable) {
            throw new TicketsSoldOutException();
        }

        Ticket ticket = new Ticket();
        ticket.setStatus(TicketStatusEnum.PURCHASED);
        ticket.setTicketType(ticketType);
        ticket.setPurchaser(user);

        Ticket savedTicket = ticketRepository.save(ticket);
        qrCodeService.generateQrCode(savedTicket);

        return ticketRepository.save(savedTicket);
    }
}
