package com.puzzle.service.entity.level2;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class GameSession {
    private String gameId;
    private Integer rows;
    private Integer cols;
    private List<PuzzlePiece> pieces;
    private Integer moveCount;
    private Integer remainingHints;
    private Long startTime;
    private Long previewEndTime;
    private Boolean isCompleted;
    private Integer score;
    private String imageUrl;
    private Integer correctPieces;
    
    @Data
    public static class PuzzlePiece {
        private Integer id;
        private Integer correctRow;
        private Integer correctCol;
        private Integer currentRow;
        private Integer currentCol;
        private Integer rotation;
        private Boolean isLocked;
        private Boolean isCorrect;
        private String imageData;
    }
    
    public GameSession() {
        this.gameId = UUID.randomUUID().toString();
        this.moveCount = 0;
        this.remainingHints = 3;
        this.isCompleted = false;
        this.startTime = System.currentTimeMillis();
    }
}