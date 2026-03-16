package com.puzzle.service.vo.level2;

import lombok.Data;
import java.util.List;

@Data
public class MemoryPuzzleVO {
    private String gameId;
    private Integer rows;
    private Integer cols;
    private List<PuzzlePieceVO> pieces;
    private Integer moveCount;
    private Integer remainingHints;
    private Long elapsedTime;
    private Boolean isPreviewPhase;
    private Boolean isCompleted;
    private Integer score;
    
    @Data
    public static class PuzzlePieceVO {
        private Integer id;
        private Integer currentRow;
        private Integer currentCol;
        private Integer rotation;
        private Boolean isLocked;
        private String imageUrl;
    }
}