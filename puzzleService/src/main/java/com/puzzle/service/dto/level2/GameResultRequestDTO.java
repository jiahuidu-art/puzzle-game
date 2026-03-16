package com.puzzle.service.dto.level2;

import lombok.Data;

@Data
public class GameResultRequestDTO {
    private String gameId;
    private Integer moveCount;
    private Integer hintsUsed;
    private Long elapsedTime;
    private Integer correctPieces;
}
