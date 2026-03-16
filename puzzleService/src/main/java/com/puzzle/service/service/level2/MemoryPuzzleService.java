package com.puzzle.service.service.level2;

import com.puzzle.service.dto.level2.GameResultRequestDTO;
import com.puzzle.service.dto.level2.GameResultResponseDTO;
import com.puzzle.service.entity.level2.GameSession;
import com.puzzle.service.vo.level2.ScoreVO;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class MemoryPuzzleService {
    
    private final Map<String, GameSession> gameSessions = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor();
    
    public MemoryPuzzleService() {
        scheduleCleanup();
    }
    
    public String startGame(Integer rows, Integer cols, String imageUrl) {
        GameSession session = new GameSession();
        session.setRows(rows);
        session.setCols(cols);
        session.setImageUrl(imageUrl);
        session.setPreviewEndTime(System.currentTimeMillis() + 5000);
        
        gameSessions.put(session.getGameId(), session);
        
        return session.getGameId();
    }
    
    public GameResultResponseDTO finishGame(GameResultRequestDTO request) {
        GameSession session = gameSessions.get(request.getGameId());
        if (session == null) {
            return createErrorResponse("游戏会话不存在");
        }
        
        session.setMoveCount(request.getMoveCount());
        session.setRemainingHints(3 - request.getHintsUsed());
        session.setIsCompleted(true);
        session.setCorrectPieces(request.getCorrectPieces());
        
        ScoreVO scoreVO = calculateScore(session);
        
        GameResultResponseDTO response = new GameResultResponseDTO();
        response.setSuccess(true);
        response.setMessage("游戏完成");
        response.setFinalScore(scoreVO.getFinalScore());
        response.setGrade(scoreVO.getGrade());
        response.setTotalMoves(request.getMoveCount());
        response.setTotalTime(request.getElapsedTime());
        response.setHintsUsed(request.getHintsUsed());
        
        return response;
    }
    
    public ScoreVO getGameResult(String gameId) {
        GameSession session = gameSessions.get(gameId);
        if (session == null || !session.getIsCompleted()) {
            return null;
        }
        
        return calculateScore(session);
    }
    
private ScoreVO calculateScore(GameSession session) {
    ScoreVO scoreVO = new ScoreVO();
    scoreVO.setGameId(session.getGameId());
    
    int correctPieces = session.getCorrectPieces() != null ? session.getCorrectPieces() : session.getRows() * session.getCols();
    double scorePerPiece = 1000.0 / (session.getRows() * session.getCols());
    int baseSteps = session.getRows() * session.getCols() * 2;
    
    int placementScore = (int) Math.round(correctPieces * scorePerPiece);
    int stepPenalty = Math.max(0, (session.getMoveCount() - baseSteps) * 1);
    int hintPenalty = (3 - session.getRemainingHints()) * 50;
    
    int finalScore = placementScore - stepPenalty - hintPenalty;
    
    scoreVO.setFinalScore(finalScore);
    scoreVO.setBaseScore(0);
    scoreVO.setMovePenalty(stepPenalty);
    scoreVO.setHintPenalty(hintPenalty);
    scoreVO.setTimePenalty(0);
    scoreVO.setTotalMoves(session.getMoveCount());
    scoreVO.setHintsUsed(3 - session.getRemainingHints());
    scoreVO.setGrade(calculateGrade(finalScore));
    
    return scoreVO;
}
    
    private String calculateGrade(Integer score) {
        if (score >= 900) return "S";
        if (score >= 800) return "A";
        if (score >= 700) return "B";
        if (score >= 600) return "C";
        return "D";
    }
    
    private GameResultResponseDTO createErrorResponse(String message) {
        GameResultResponseDTO response = new GameResultResponseDTO();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
    
    private void scheduleCleanup() {
        cleanupExecutor.scheduleAtFixedRate(() -> {
            long currentTime = System.currentTimeMillis();
            gameSessions.entrySet().removeIf(entry -> {
                GameSession session = entry.getValue();
                long sessionAge = currentTime - session.getStartTime();
                return sessionAge > TimeUnit.HOURS.toMillis(1);
            });
        }, 1, 1, TimeUnit.HOURS);
    }
}