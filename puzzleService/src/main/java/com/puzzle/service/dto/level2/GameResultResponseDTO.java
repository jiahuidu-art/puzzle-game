package com.puzzle.service.dto.level2;

import lombok.Data;

@Data
public class GameResultResponseDTO {
    private Boolean success;
    private String message;
    private Integer finalScore;
    private String grade;
    private Integer totalMoves;
    private Long totalTime;
    private Integer hintsUsed;
}
