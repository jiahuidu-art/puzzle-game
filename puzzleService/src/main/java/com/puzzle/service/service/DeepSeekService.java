package com.puzzle.service.service;

import com.puzzle.service.config.DeepSeekConfig;
import com.puzzle.service.dto.PuzzleStateDTO;
import com.puzzle.service.dto.AIHintResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.stream.Collectors;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

@Slf4j
@Service
public class DeepSeekService {
    
    private final WebClient webClient;
    private final DeepSeekConfig config;
    private final ObjectMapper objectMapper;
    
    @Autowired
    public DeepSeekService(DeepSeekConfig config, ObjectMapper objectMapper) {
        this.config = config;
        this.objectMapper = objectMapper;
        
        this.webClient = WebClient.builder()
            .baseUrl(config.getUrl())
            .defaultHeader("Authorization", "Bearer " + config.getKey())
            .defaultHeader("Content-Type", "application/json")
            .build();
    }
    
    public AIHintResponseDTO getHint(PuzzleStateDTO state) {
        log.info("获取AI提示，拼图状态: {}x{}, 移动次数: {}", 
                state.getRows(), state.getCols(), state.getMoveCount());
        
        try {
            // 1. 构建 prompt
            String prompt = buildPrompt(state);

            // 2. 调用 DeepSeek API
            Map<String, Object> request = new HashMap<>();
            request.put("model", "deepseek-chat");

            List<Map<String, String>> messages = new ArrayList<>();

            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", buildSystemPrompt());
            messages.add(systemMessage);

            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);

            request.put("messages", messages);

            Map<String, String> responseFormat = new HashMap<>();
            responseFormat.put("type", "json_object");
            request.put("response_format", responseFormat);

            request.put("temperature", 0.7);
            request.put("max_tokens", 500);
            
            log.debug("发送DeepSeek API请求");
            // 明确设置为非流式
            request.put("stream", false);
            // 先获取原始字符串响应，用于过滤空行
            String rawResponse = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            // 过滤空行和SSE注释
            if (rawResponse != null && !rawResponse.trim().isEmpty()) {
                log.debug("原始API响应: {}", rawResponse);
                
                // 使用Java 8兼容的方式分割和过滤
                String[] lines = rawResponse.split("\\r?\\n");
                StringBuilder filteredResponse = new StringBuilder();
                
                for (String line : lines) {
                    String trimmedLine = line.trim();
                    if (!trimmedLine.isEmpty() && !trimmedLine.startsWith(":")) {
                        filteredResponse.append(trimmedLine).append("\n");
                    }
                }
                
                log.debug("过滤后响应长度: {}", filteredResponse.length());
                
                if (filteredResponse.length() > 0) {
                    Map response = objectMapper.readValue(filteredResponse.toString(), Map.class);
                    return parseResponse(response);
                }
            } else {
                log.debug("API返回空响应或null");
            }
            return getFallbackHint(state, "API响应为空");
//            Map response = webClient.post()
//                .uri("/chat/completions")
//                .bodyValue(request)
//                .retrieve()
//                .bodyToMono(Map.class)
//                .block();
//
//            // 3. 解析响应
//            return parseResponse(response);
            
        } catch (WebClientResponseException e) {
            log.error("DeepSeek API调用失败，状态码: {}, 响应: {}", 
                     e.getStatusCode(), e.getResponseBodyAsString());
            return getFallbackHint(state, "API调用失败: " + e.getStatusCode());
            
        } catch (Exception e) {
            log.error("获取AI提示时发生异常", e);
            return getFallbackHint(state, "系统异常: " + e.getMessage());
        }
    }

    private String buildSystemPrompt() {
        return "你是一个拼图游戏助手。分析拼图状态，给出下一步建议。\n" +
                "**非常重要：你必须只返回一个JSON对象，不要包含任何其他文本、解释或推理过程！**\n" +
                "返回格式必须是严格的JSON，不能有任何其他内容：\n" +
                "{\n" +
                "    \"pieceId\": 数字,           // 建议操作的拼图块ID(从0开始，从左向右从上到下)\n" +
                "    \"currentRow\": 数字,        // 该块当前所在行\n" +
                "    \"currentCol\": 数字,        // 该块当前所在列\n" +
                "    \"targetRow\": 数字,         // 目标行\n" +
                "    \"targetCol\": 数字,         // 目标列\n" +
                "    \"targetRotation\": 数字,     //目标旋转角度(需要旋转多少度这个拼图块才是正常的)\n" +
                "    \"reason\": \"字符串\",       // 建议原因\n" +
                "    \"encouragement\": \"字符串\" // 鼓励的话\n" +
                "}\n" +
                "示例：\n" +
                "{\n" +
                "    \"pieceId\": 8,\n" +
                "    \"currentRow\": 2,\n" +
                "    \"currentCol\": 1,\n" +
                "    \"targetRow\": 3,\n" +
                "    \"targetCol\": 4,\n" +
                "    \"targetRotation\": 0或90或180或270,\n" +
                "    \"reason\": \"这个块应该在第targetRow+1行第targetCol+1列，但现在在第currentRow+1行第currentCol+1列\",\n" +
                "    \"encouragement\": \"加油\"\n" +
                "}\n" +
                "优先处理位置错误的拼图块。";
    }
    
    private String buildPrompt(PuzzleStateDTO state) {
        StringBuilder prompt = new StringBuilder();
        prompt.append(String.format("拼图：%dx%d，移动%d次。\n", 
                state.getRows(), state.getCols(), state.getMoveCount()));
        
        prompt.append("块状态：\n");
        for (PuzzleStateDTO.PieceDTO piece : state.getPieces()) {
            boolean isCorrectPosition = piece.getCurrentRow().equals(piece.getCorrectRow()) && 
                                       piece.getCurrentCol().equals(piece.getCorrectCol());
            boolean isCorrectRotation = piece.getRotation() == 0;
            String status = isCorrectPosition ? "✅" : "❌";
            String rotation = piece.getRotation() != 0 ? String.valueOf(piece.getRotation()) + "°" : "";
            
            prompt.append(String.format(
                "%d:(%d,%d)→(%d,%d)%s%s\n",
                piece.getId(), piece.getCurrentRow(), piece.getCurrentCol(),
                piece.getCorrectRow(), piece.getCorrectCol(), status, rotation
            ));
        }
        
        prompt.append("建议下一步？");
        return prompt.toString();
    }
    
    @SuppressWarnings("unchecked")
    private AIHintResponseDTO parseResponse(Map response) {
        try {
            if (response == null) {
                throw new IllegalArgumentException("API响应为空");
            }
            
            if (response.containsKey("error")) {
                Map<String, Object> error = (Map<String, Object>) response.get("error");
                throw new RuntimeException("API错误: " + error.get("message"));
            }
            
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new IllegalArgumentException("API响应中没有choices");
            }
            
            Map<String, Object> choice = choices.get(0);
            Map<String, Object> message = (Map<String, Object>) choice.get("message");
            
            // 优先使用reasoning_content字段（deepseek-reasoner模型）
            String content = (String) message.get("content");
            if (content == null || content.trim().isEmpty()) {
                // 如果reasoning_content为空，使用标准的content字段
                content = (String) message.get("reasoning_content");
            }
            
            if (content == null || content.trim().isEmpty()) {
                throw new IllegalArgumentException("AI响应内容为空");
            }

            // 尝试从content中提取JSON部分
            String jsonContent = extractJsonFromText(content);
            log.debug("提取的JSON: {}", jsonContent);
            // 解析JSON内容
            Map<String, Object> aiResponse = objectMapper.readValue(jsonContent, Map.class);
            
            return AIHintResponseDTO.builder()
                .pieceId(((Number) aiResponse.get("pieceId")).intValue())
                .currentRow(((Number) aiResponse.get("currentRow")).intValue())
                .currentCol(((Number) aiResponse.get("currentCol")).intValue())
                .targetRow(((Number) aiResponse.get("targetRow")).intValue())
                .targetCol(((Number) aiResponse.get("targetCol")).intValue())
                .targetRotation(((Number) aiResponse.get("targetRotation")).intValue())
                .reason((String) aiResponse.get("reason"))
                .encouragement((String) aiResponse.get("encouragement"))
                .build();
                
        } catch (Exception e) {
            log.error("解析DeepSeek响应失败", e);
            throw new RuntimeException("解析AI响应失败: " + e.getMessage(), e);
        }
    }
    
    private AIHintResponseDTO getFallbackHint(PuzzleStateDTO state, String errorReason) {
        log.warn("使用降级策略生成提示");
        
        // 简单的降级策略：找到第一个位置错误的拼图块
        for (PuzzleStateDTO.PieceDTO piece : state.getPieces()) {
            if (!piece.getCurrentRow().equals(piece.getCorrectRow()) || 
                !piece.getCurrentCol().equals(piece.getCorrectCol())) {
                
                return AIHintResponseDTO.builder()
                    .pieceId(piece.getId())
                    .targetRow(piece.getCorrectRow())
                    .targetCol(piece.getCorrectCol())
                    .targetRotation(0)
                    .reason("降级提示：建议将块" + (piece.getId() + 1) + "移动到正确位置。" + errorReason)
                    .encouragement("继续努力！")
                    .build();
            }
        }
        
        // 如果所有位置都正确，检查旋转
        for (PuzzleStateDTO.PieceDTO piece : state.getPieces()) {
            if (piece.getRotation() != 0) {
                return AIHintResponseDTO.builder()
                    .pieceId(piece.getId())
                    .targetRow(piece.getCurrentRow())
                    .targetCol(piece.getCurrentCol())
                    .targetRotation(0)
                    .reason("降级提示：建议将块" + (piece.getId() + 1) + "旋转到正确角度。" + errorReason)
                    .encouragement("快完成了！")
                    .build();
            }
        }
        
        // 默认提示
        return AIHintResponseDTO.builder()
            .pieceId(0)
            .targetRow(0)
            .targetCol(0)
            .targetRotation(0)
            .reason("降级提示：拼图看起来已经完成！" + errorReason)
            .encouragement("恭喜！")
            .build();
    }

    // 从文本中提取JSON部分
    private String extractJsonFromText(String text) {
        // 查找第一个{和最后一个}
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');

        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1);
        }

        return text; // 如果没有找到，返回原文本
    }
}