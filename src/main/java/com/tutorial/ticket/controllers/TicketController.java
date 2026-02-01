package com.tutorial.ticket.controllers;

import com.tutorial.ticket.domain.dtos.GetTicketResponseDto;
import com.tutorial.ticket.domain.dtos.ListTicketResponseDto;
import com.tutorial.ticket.mappers.TicketMapper;
import com.tutorial.ticket.services.QrCodeService;
import com.tutorial.ticket.services.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping(path = "/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final TicketMapper ticketMapper;
    private final QrCodeService qrCodeService;

    // ----------------------------
    // GET /api/v1/tickets
    // ----------------------------
    @GetMapping
    public Page<ListTicketResponseDto> listTickets(
            @AuthenticationPrincipal Jwt jwt,
            Pageable pageable
    ) {
        UUID userId = parseUserId(jwt);

        return ticketService
                .listTicketsForUser(userId, pageable)
                .map(ticketMapper::toListTicketResponseDto);
    }

    // ----------------------------
    // GET /api/v1/tickets/{ticketId}
    // ----------------------------
    @GetMapping(path = "/{ticketId}")
    public ResponseEntity<GetTicketResponseDto> getTicket(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID ticketId
    ) {
        UUID userId = parseUserId(jwt);

        return ticketService
                .getTicketForUser(userId, ticketId)
                .map(ticketMapper::toGetTicketResponseDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ----------------------------
    // GET /api/v1/tickets/{ticketId}/qr-codes
    // ----------------------------
    @GetMapping(path = "/{ticketId}/qr-codes")
    public ResponseEntity<byte[]> getTicketQrCode(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID ticketId
    ) {
        UUID userId = parseUserId(jwt);

        byte[] qrCodeImage =
                qrCodeService.getQrCodeImageForUserAndTicket(userId, ticketId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setContentLength(qrCodeImage.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(qrCodeImage);
    }

    // ----------------------------
    // Helper: extract user ID from JWT
    // ----------------------------
    private UUID parseUserId(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("Invalid user id in JWT subject", ex);
        }
    }
}
