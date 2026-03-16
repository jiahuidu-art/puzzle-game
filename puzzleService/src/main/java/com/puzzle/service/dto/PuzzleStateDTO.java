package com.puzzle.service.dto;

import lombok.Data;
import java.util.List;

@Data
public class PuzzleStateDTO {
    private Integer rows;
    private Integer cols;
    private Integer moveCount;
    private List<PieceDTO> pieces;
    
    @Data
    public static class PieceDTO {
        private Integer id;
        private Integer currentRow;
        private Integer currentCol;
        private Integer correctRow;
        private Integer correctCol;
        private Integer rotation;
    }
}