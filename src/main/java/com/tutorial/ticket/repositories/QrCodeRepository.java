package com.tutorial.ticket.repositories;

import com.tutorial.ticket.domain.entities.QrCode;
import com.tutorial.ticket.domain.entities.QrCodeStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QrCodeRepository extends JpaRepository<QrCode, UUID> {
    Optional<QrCode> findByTicketIdAndTicketPurchaserId(UUID ticketId, UUID ticketPurchaseId);
    Optional<QrCode> findByIdAndStatus(UUID id, QrCodeStatusEnum status);
}
