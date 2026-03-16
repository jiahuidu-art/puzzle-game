package com.puzzle.service.dto.level2;

import lombok.Data;

@Data
public class MemoryPuzzleRequestDTO {
    private String gameId;
    private Integer pieceId;
    private Integer targetRow;
    private Integer targetCol;
    private Integer rotation;
    private Boolean useHint;
}