package com.jyx.ai;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class DeepSeekAnalysisServiceTest {

    @Test
    void fallbackAnalysisContainsHealthAdviceWhenApiKeyMissing() {
        DeepSeekAnalysisService service = new DeepSeekAnalysisService("", "https://api.deepseek.com/chat/completions", "DeepSeek-V4-Flash");

        String result = service.analyze("血糖 6.8 mmol/L，血脂偏高，运动不足");

        assertTrue(result.contains("血糖"));
        assertTrue(result.contains("建议"));
        assertTrue(result.contains("仅供健康管理参考"));
    }
}
