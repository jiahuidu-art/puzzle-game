package com.puzzle.service.controller.level2;

import com.puzzle.service.dto.level2.GameResultRequestDTO;
import com.puzzle.service.dto.level2.GameResultResponseDTO;
import com.puzzle.service.service.level2.MemoryPuzzleService;
import com.puzzle.service.vo.level2.ScoreVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/level2")
public class MemoryPuzzleController {
    
    @Autowired
    private MemoryPuzzleService memoryPuzzleService;
    
    @PostMapping("/start")
    public ResponseEntity<String> startGame(
            @RequestParam(defaultValue = "3") Integer rows,
            @RequestParam(defaultValue = "3") Integer cols,
            @RequestParam(required = false) String imageUrl) {
        
        String gameId = memoryPuzzleService.startGame(rows, cols, imageUrl);
        return ResponseEntity.ok(gameId);
    }
    
    @PostMapping("/finish")
    public ResponseEntity<GameResultResponseDTO> finishGame(@RequestBody GameResultRequestDTO request) {
        GameResultResponseDTO response = memoryPuzzleService.finishGame(request);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/result/{gameId}")
    public ResponseEntity<ScoreVO> getGameResult(@PathVariable String gameId) {
        ScoreVO result = memoryPuzzleService.getGameResult(gameId);
        if (result != null) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}