package com.puzzle.service.dto.level2;

import lombok.Data;
import java.util.List;

@Data
public class MemoryPuzzleStateDTO {
    private String gameId;
    private Integer rows;
    private Integer cols;
    private List<PuzzlePieceDTO> pieces;
    private Integer moveCount;
    private Integer remainingHints;
    private Long startTime;
    private Long elapsedTime;
    private Boolean isCompleted;
    private Integer score;
    
    @Data
    public static class PuzzlePieceDTO {
        private Integer id;
        private Integer correctRow;
        private Integer correctCol;
        private Integer currentRow;
        private Integer currentCol;
        private Integer rotation;
        private Boolean isLocked;
        private Boolean isCorrect;
    }
}