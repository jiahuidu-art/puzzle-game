package com.puzzle.service.vo.level2;

import lombok.Data;

@Data
public class ScoreVO {
    private String gameId;
    private Integer finalScore;
    private Integer baseScore;
    private Integer timePenalty;
    private Integer movePenalty;
    private Integer hintPenalty;
    private Long totalTime;
    private Integer totalMoves;
    private Integer hintsUsed;
    private String grade;
}