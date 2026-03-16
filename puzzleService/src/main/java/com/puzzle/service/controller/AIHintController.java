package com.puzzle.service.controller;

import com.puzzle.service.dto.PuzzleStateDTO;
import com.puzzle.service.dto.AIHintResponseDTO;
import com.puzzle.service.service.DeepSeekService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AIHintController {
    
    @Autowired
    private DeepSeekService deepSeekService;
    
    @PostMapping("/hint")
    public AIHintResponseDTO getHint(@RequestBody PuzzleStateDTO puzzleState) {
        // 调用真正的 AI 服务
        return deepSeekService.getHint(puzzleState);
    }
}