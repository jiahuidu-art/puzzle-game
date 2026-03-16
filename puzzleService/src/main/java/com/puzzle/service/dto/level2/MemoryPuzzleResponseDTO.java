package com.puzzle.service.dto.level2;

import lombok.Data;

@Data
public class MemoryPuzzleResponseDTO {
    private Boolean success;
    private String message;
    private MemoryPuzzleStateDTO gameState;
    private Boolean isCorrect;
    private Boolean isCompleted;
    private Integer score;
}