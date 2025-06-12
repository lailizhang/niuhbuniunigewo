// 游戏生成器核心逻辑 - 专注AI生成
document.addEventListener('DOMContentLoaded', () => {
    const gameInput = document.getElementById('gameInput');
    const generateBtn = document.getElementById('generateBtn');
    const progressBar = document.getElementById('progressBar');
    const playBtn = document.getElementById('playBtn');
    const gameFrame = document.getElementById('gameFrame');
    const gameStatus = document.getElementById('gameStatus');
    
    // DeepSeek API配置
    const API_KEY = 'sk-4f17dae13e2f4ced850ccda6a74418ff';
    const API_URL = 'https://api.deepseek.com/chat/completions';
    
    // 更新进度
    function updateProgress(percentage) {
        progressBar.style.width = `${percentage}%`;
    }
    
    // AI生成游戏
    async function generateGame() {
        const prompt = gameInput.value.trim();
        if (!prompt) {
            alert('请输入游戏描述');
            return;
        }
        
        try {
            // 重置状态
            playBtn.disabled = true;
            gameStatus.textContent = 'AI正在生成游戏...';
            updateProgress(0);
            
            // 构建AI提示词
            const aiPrompt = `你是一个专业的HTML5游戏生成器。请严格根据以下描述生成完整可玩的游戏：
## 要求
1. 使用Canvas实现核心游戏逻辑
2. 提供完整的控制方案：
   - 桌面设备：键盘控制（方向键移动，空格键射击/行动）+ 鼠标控制（点击交互和拖拽控制）
   - 移动设备：触摸控制（虚拟摇杆/按钮）+ 手势操作（滑动、点击）
3. 实现得分系统和游戏结束条件
4. 完全自包含的HTML+CSS+JS代码
5. 代码小于500KB
6. 响应式设计：适配手机、平板和桌面设备

## 游戏描述
${prompt}

## 输出要求
只返回纯代码，不要任何解释！`;
            
            // API请求
            const requestData = {
                model: 'deepseek-chat', // 使用当前可用模型
                messages: [
                    { role: 'system', content: aiPrompt }
                ],
                max_tokens: 4000,
                temperature: 0.7,
                stream: false
            };
            
            // 模拟进度（AI生成需要时间）
            const progressInterval = setInterval(() => {
                const currentWidth = parseFloat(progressBar.style.width || '0');
                if (currentWidth < 90) {
                    updateProgress(currentWidth + 10);
                }
            }, 500);
            
            // 带重试机制的API调用
            let response;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount <= maxRetries) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5分钟超时
                    
                    response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${API_KEY}`
                        },
                        body: JSON.stringify(requestData),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    break; // 成功则跳出循环
                    
                } catch (error) {
                    if (error.name === 'AbortError' && retryCount < maxRetries) {
                        retryCount++;
                        gameStatus.textContent = `请求超时，正在重试 (${retryCount}/${maxRetries})...`;
                        await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒后重试
                    } else {
                        throw error;
                    }
                }
            }
            
            clearInterval(progressInterval);
            updateProgress(100);
            gameStatus.textContent = '正在处理AI响应...';
            
            if (!response.ok) {
                const error = await response.json();
                // 特殊处理模型不存在错误
                if (error.error?.code === 'model_not_found') {
                    throw new Error('AI模型不可用，请稍后重试');
                }
                throw new Error(`AI生成失败: ${error.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            // 提取游戏代码
            const gameCode = aiResponse.replace(/```(html|javascript|css)?/g, '');
            
            // 设置游戏
            gameFrame.srcdoc = gameCode;
            gameStatus.textContent = 'AI游戏生成完成！';
            playBtn.disabled = false;
            
        } catch (error) {
            console.error('AI生成失败:', error);
            gameStatus.textContent = `错误: ${error.message} - 请重试或优化描述`;
            updateProgress(0);
        }
    }
    
    // 启动游戏
    function startGame() {
        if (gameFrame && gameFrame.contentWindow) {
            gameFrame.contentWindow.focus();
        }
    }
    
    // 事件监听
    generateBtn.addEventListener('click', generateGame);
    playBtn.addEventListener('click', startGame);
});