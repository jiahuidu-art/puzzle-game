# 🧩 拼图游戏(puzzle-game)
An interesting jigsaw puzzle game.

[![GitHub stars](https://img.shields.io/github/stars/jiahuidu-art/puzzle-game?style=social)](https://github.com/jiahuidu-art/puzzle-game)
[![GitHub forks](https://img.shields.io/github/forks/jiahuidu-art/puzzle-game?style=social)](https://github.com/jiahuidu-art/puzzle-game)

基于 Web 技术开发的交互式拼图游戏，支持经典模式（配备 AI 智能提示）和记忆模式（瞬时记忆挑战）。游戏提供沉浸式音频体验和精美的视觉设计，适用于休闲娱乐与思维训练。

## 项目简介

本项目采用前后端分离架构，前端使用 HTML5/CSS3/JavaScript 实现，后端基于 Spring Boot 框架开发。游戏支持多种难度级别，提供 AI 智能提示功能，并配备背景音乐和音效系统，为用户提供完整的游戏体验。

## 功能特性

### 游戏模式
**游戏主页**
<img width="1856" height="948" alt="homepage" src="https://github.com/user-attachments/assets/ce8dde14-c88e-4d92-8dad-e146abf1a716" />
- 两种游戏模式选择入口
- 动态背景视觉效果
- 背景音乐播放控制
- 响应式设计，适配多种设备

**经典模式**
<img width="1857" height="957" alt="classic-mode" src="https://github.com/user-attachments/assets/1b69bc76-8ea8-4a8e-b2f4-5e87ba0f4410" />

- 支持自定义图片上传或使用默认拼图
- 可调节难度级别（2×2 至 10×10 网格）
- 拖拽交互，支持拼图块旋转
- 智能吸附机制，优化操作体验
- AI 智能提示系统（基于 DeepSeek API）

**记忆模式**
<img width="1863" height="951" alt="memory-mode" src="https://github.com/user-attachments/assets/715efffe-cd48-4aaf-b44e-5f1f32e8ec5a" />

- 图像预览与记忆挑战机制
- 多关卡递进式难度设计
- 实时计分与进度追踪
- 自动加载下一关卡

### 技术特性

**前端技术**
- Canvas API 图像处理
- 响应式布局设计
- CSS3 动画与过渡效果
- 跨平台兼容（桌面/移动端）

**后端技术**
- RESTful API 设计
- 异步请求处理（WebFlux）
- 环境变量配置管理
- 模块化代码架构

### 用户体验

- 动态背景视觉效果
- 背景音乐播放系统（支持多曲目切换）
- 交互音效反馈
- 实时游戏状态显示

## 技术栈

### 前端
- HTML5
- CSS3（Flexbox 布局、媒体查询、动画）
- JavaScript ES6+
- Canvas API

### 后端
- Java 8
- Spring Boot 2.7.13
- Spring Web
- Spring WebFlux
- Lombok
- Maven

### 外部服务
- DeepSeek API（AI 提示服务）

## 项目结构
puzzle-game/
├── puzzleWeb/              # 前端应用
│   ├── index.html         # 主入口页面
│   ├── level1/            # 经典模式
│   │   ├── index.html
│   │   ├── game.js
│   │   └── style.css
│   ├── level2/            # 记忆模式
│   │   ├── index.html
│   │   ├── game.js
│   │   └── style.css
│   └── assets/            # 资源文件
│       ├── images/        # 图像资源
│       │   └── level2/    # 记忆模式关卡图片
│       └── sounds/        # 音频资源
│           ├── bgm/       # 背景音乐
│           └── sfx/       # 音效
│
├── puzzleService/         # 后端应用
│   ├── src/main/java/com/puzzle/service/
│   │   ├── config/        # 配置类
│   │   ├── controller/    # 控制器层
│   │   ├── dto/           # 数据传输对象
│   │   ├── entity/        # 实体类
│   │   ├── service/       # 业务逻辑层
│   │   └── vo/            # 视图对象
│   └── src/main/resources/
│       └── application.yml
│
└── README.md

## 环境要求

- Java 8 或更高版本
- Maven 3.6+
- 现代浏览器（Chrome、Firefox、Safari、Edge）

## 快速开始

### 前端部署

1. 克隆项目仓库
```bash
git clone https://github.com/jiahuidu-art/puzzle-game.git
```

2. 进入前端目录
```bash
cd puzzle-game/puzzleWeb
```

3. 启动本地服务器（使用 Node.js）
```bash
# 首次使用安装 http-server
npm install -g http-server

# 启动服务器
http-server -p 8000
```

4. 访问 http://localhost:8000

### 后端部署

1. 进入后端目录
```bash
cd puzzle-game/puzzleService
```

2. 配置环境变量
```bash
# Windows
set DEEPSEEK_API_KEY=your_api_key

# Linux/Mac
export DEEPSEEK_API_KEY=your_api_key
```

3. 编译并运行
```bash
mvn clean install
mvn spring-boot:run
```

4. 后端服务启动于 http://localhost:8080

## 在线体验

本项目已部署至阿里云 ECS 服务器：
- 前端地址：[http://112.124.58.232/]
- 后端 API：[http://112.124.58.232:8080/]

## 游戏说明

### 经典模式操作指南

1. 选择网格尺寸（2×2 至 10×10）
2. 上传本地图片或使用默认图像
3. 点击"开始游戏"初始化拼图
4. 拖拽拼图块至目标位置
5. 双击拼图块进行旋转
6. 使用提示功能获取 AI 建议
7. 完成拼图后查看成绩

### 记忆模式操作指南

1. 从第一关开始游戏
2. 在预览阶段观察完整图像
3. 点击开始后拼图块随机分布
4. 凭记忆还原图像
5. 完成当前关卡后自动解锁下一关

## 版本历史

### v1.0.1 (2026-03-16)
- 新增动态背景视觉效果
- 实现背景音乐播放系统
- 记忆模式增加关卡递进功能
- 优化用户界面设计
- 扩展图像资源库

### v1.0.0 (2026-03-13)
- 项目初始版本发布
- 实现经典模式核心功能
- 实现记忆模式核心功能
- 集成 AI 智能提示系统
- 完成响应式设计

## 贡献指南

欢迎社区贡献。提交贡献前请确保：
1. 代码符合项目规范
2. 提交信息清晰明确
3. 通过所有测试用例
4. 更新相关文档

## 许可证

本项目采用 MIT 许可证开源。

## 联系方式

- GitHub：[jiahuidu-art](https://github.com/jiahuidu-art)
- Email: dujiahui3208103@163.com

---
目前只实现了拼图游戏的基础功能，还处于初步开发阶段，后续会逐步完善功能并设计有趣的模式。

