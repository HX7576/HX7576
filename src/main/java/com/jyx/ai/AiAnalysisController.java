package com.jyx.ai;

import com.jyx.Data_unification.Unification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiAnalysisController {

    private final DeepSeekAnalysisService deepSeekAnalysisService;

    public AiAnalysisController(DeepSeekAnalysisService deepSeekAnalysisService) {
        this.deepSeekAnalysisService = deepSeekAnalysisService;
    }

    @PostMapping("/analyze")
    public Unification<Map<String, Object>> analyze(@RequestBody Map<String, Object> request) {
        String reportText = String.valueOf(request.getOrDefault("reportText", ""));
        Map<String, Object> data = deepSeekAnalysisService.analyzeDetailed(reportText);
        data.put("score", score(reportText));
        return Unification.success(data);
    }

    private int score(String text) {
        int score = 88;
        if (text.contains("偏高") || text.contains("异常") || text.contains("6.8") || text.contains("135")) {
            score -= 8;
        }
        if (text.contains("运动不足") || text.contains("睡眠不足") || text.contains("运动频率偏低")) {
            score -= 5;
        }
        return Math.max(score, 60);
    }
}
