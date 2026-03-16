package com.puzzle.service.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "请开始游戏吧！";
    }
}