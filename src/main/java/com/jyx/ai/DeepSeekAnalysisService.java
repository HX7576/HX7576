package com.jyx.ai;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class DeepSeekAnalysisService {

    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final HttpClient httpClient;

    public DeepSeekAnalysisService(
            @Value("${deepseek.api-key:}") String apiKey,
            @Value("${deepseek.base-url:https://api.deepseek.com/chat/completions}") String baseUrl,
            @Value("${deepseek.model:deepseek-v4-flash}") String model) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public Map<String, Object> analyzeDetailed(String reportText) {
        Map<String, Object> data = new HashMap<>();
        data.put("model", model);

        if (!StringUtils.hasText(apiKey)) {
            data.put("result", fallbackAnalysis(reportText));
            data.put("source", "local_fallback");
            data.put("sourceText", "未配置 DeepSeek Key，已使用本地健康规则分析");
            return data;
        }

        try {
            JSONObject payload = new JSONObject();
            payload.put("model", model);
            payload.put("temperature", 0.2);
            payload.put("max_tokens", 1200);

            JSONArray messages = new JSONArray();
            messages.add(message("system", "你是个人健康智能管理系统中的 AI 健康分析助手。请只用简短中文输出，不使用 Markdown，不使用星号、井号、横线分隔符，避免诊断式绝对结论，必须提醒仅供健康管理参考。"));
            messages.add(message("user", buildPrompt(reportText)));
            payload.put("messages", messages);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl))
                    .timeout(Duration.ofSeconds(35))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toJSONString(), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                data.put("result", fallbackAnalysis(reportText));
                data.put("source", "local_fallback");
                data.put("sourceText", "DeepSeek 接口返回 " + response.statusCode() + "，已使用本地健康规则分析");
                return data;
            }

            JSONObject json = JSONObject.parseObject(response.body());
            JSONArray choices = json.getJSONArray("choices");
            JSONObject message = choices == null || choices.isEmpty() ? null : choices.getJSONObject(0).getJSONObject("message");
            String content = message == null ? null : message.getString("content");
            if (StringUtils.hasText(content)) {
                data.put("result", content);
                data.put("source", "deepseek");
                data.put("sourceText", "真实 AI 分析");
                return data;
            }
        } catch (Exception ex) {
            data.put("error", ex.getClass().getSimpleName() + ": " + ex.getMessage());
        }

        data.put("result", fallbackAnalysis(reportText));
        data.put("source", "local_fallback");
        data.put("sourceText", "DeepSeek 暂不可用，已使用本地健康规则分析");
        return data;
    }

    public String analyze(String reportText) {
        return String.valueOf(analyzeDetailed(reportText).get("result"));
    }

    private JSONObject message(String role, String content) {
        JSONObject message = new JSONObject();
        message.put("role", role);
        message.put("content", content);
        return message;
    }

    private String buildPrompt(String reportText) {
        return "请分析以下健康数据或体检报告：\n"
                + reportText
                + "\n\n请按以下 7 行输出，每行不超过 65 个字，不要使用 Markdown 符号：\n"
                + "整体评估：\n"
                + "关注指标：\n"
                + "风险等级：\n"
                + "饮食建议：具体说明少吃什么、多吃什么。\n"
                + "运动建议：具体说明做什么运动、频率和时长。\n"
                + "生活方式：具体说明睡眠、饮水或作息建议。\n"
                + "复查提醒：本结果仅供健康管理参考，不能替代医生诊断。";
    }

    private String fallbackAnalysis(String reportText) {
        boolean sugarRisk = reportText != null && (reportText.contains("血糖") || reportText.toLowerCase().contains("glucose"));
        boolean lipidRisk = reportText != null && (reportText.contains("血脂") || reportText.contains("胆固醇") || reportText.contains("甘油三酯"));
        StringBuilder builder = new StringBuilder();
        builder.append("1. 整体评估：当前健康数据可用于建立个人健康画像，建议结合历史记录持续观察趋势。\n");
        builder.append("2. 需要关注的指标：");
        if (sugarRisk || lipidRisk) {
            if (sugarRisk) {
                builder.append("血糖存在波动或偏高风险；");
            }
            if (lipidRisk) {
                builder.append("血脂相关指标需要关注；");
            }
        } else {
            builder.append("建议重点关注血压、血糖、血脂、心率、体重和睡眠质量。");
        }
        builder.append("\n3. 风险等级：轻度至中度预警，需要结合复查结果判断。\n");
        builder.append("4. 饮食建议：减少精制碳水和高脂饮食，增加蔬菜、优质蛋白和膳食纤维摄入。\n");
        builder.append("5. 运动建议：每周进行 3-5 次中等强度有氧运动，每次 30-45 分钟，并根据心率调整强度。\n");
        builder.append("6. 复查与就医提醒：如指标持续异常或出现明显不适，请及时咨询医生。本结果仅供健康管理参考，不能替代医生诊断。");
        return builder.toString();
    }
}
