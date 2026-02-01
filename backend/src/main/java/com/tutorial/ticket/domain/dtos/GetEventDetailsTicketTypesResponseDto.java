package com.tutorial.ticket.domain.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetEventDetailsTicketTypesResponseDto {

    private UUID id;
    private String name;
    private BigDecimal price;
    private int totalQuantity;
    private int remainingQuantity;
}
