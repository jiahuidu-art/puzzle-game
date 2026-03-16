package com.puzzle.service.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class AIHintResponseDTO {
    private Integer pieceId;
    private Integer currentRow;
    private Integer currentCol;
    private Integer targetRow;
    private Integer targetCol;
    private Integer targetRotation;
    private String reason;
    private String encouragement;
}