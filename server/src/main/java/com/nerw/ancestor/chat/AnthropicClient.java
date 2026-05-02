package com.nerw.ancestor.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.function.Consumer;

@Component
public class AnthropicClient {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final String apiUrl;
    private final String apiKey;
    private final String model;
    private final int maxTokens;

    public AnthropicClient(
            @Value("${anthropic.api-url}") String apiUrl,
            @Value("${anthropic.api-key:}") String apiKey,
            @Value("${anthropic.model}") String model,
            @Value("${anthropic.max-tokens}") int maxTokens) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.model = model;
        this.maxTokens = maxTokens;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public static class AnthropicException extends RuntimeException {
        public AnthropicException(String msg) { super(msg); }
        public AnthropicException(String msg, Throwable t) { super(msg, t); }
    }

    /**
     * POSTs to /v1/messages with stream=true and forwards each text delta to onChunk.
     * Returns the assembled full response text.
     */
    public String streamMessage(String systemPrompt, List<Message> history, String userMsg, Consumer<String> onChunk) {
        if (!isConfigured()) {
            throw new AnthropicException("ANTHROPIC_API_KEY not configured");
        }

        ObjectNode body = JSON.createObjectNode();
        body.put("model", model);
        body.put("max_tokens", maxTokens);
        body.put("system", systemPrompt);
        body.put("stream", true);

        ArrayNode messages = body.putArray("messages");
        if (history != null) {
            for (Message m : history) {
                String role = "ancestor".equals(m.role()) ? "assistant" : "user";
                ObjectNode msg = messages.addObject();
                msg.put("role", role);
                msg.put("content", m.content());
            }
        }
        ObjectNode last = messages.addObject();
        last.put("role", "user");
        last.put("content", userMsg);

        String payload;
        try {
            payload = JSON.writeValueAsString(body);
        } catch (Exception e) {
            throw new AnthropicException("Failed to encode request", e);
        }

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/v1/messages"))
                .timeout(Duration.ofSeconds(120))
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .header("accept", "text/event-stream")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();

        StringBuilder full = new StringBuilder();
        try {
            HttpResponse<java.io.InputStream> resp = http.send(req, HttpResponse.BodyHandlers.ofInputStream());
            if (resp.statusCode() / 100 != 2) {
                String err = new String(resp.body().readAllBytes(), StandardCharsets.UTF_8);
                throw new AnthropicException("Anthropic API error " + resp.statusCode() + ": " + err);
            }

            try (BufferedReader r = new BufferedReader(new InputStreamReader(resp.body(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = r.readLine()) != null) {
                    if (!line.startsWith("data:")) continue;
                    String data = line.substring(5).trim();
                    if (data.isEmpty() || "[DONE]".equals(data)) continue;

                    JsonNode evt;
                    try {
                        evt = JSON.readTree(data);
                    } catch (Exception parseErr) {
                        continue;
                    }

                    String type = evt.path("type").asText("");
                    if ("content_block_delta".equals(type)) {
                        String text = evt.path("delta").path("text").asText("");
                        if (!text.isEmpty()) {
                            full.append(text);
                            onChunk.accept(text);
                        }
                    } else if ("message_stop".equals(type)) {
                        break;
                    }
                }
            }
        } catch (AnthropicException e) {
            throw e;
        } catch (Exception e) {
            throw new AnthropicException("Anthropic streaming failed: " + e.getMessage(), e);
        }
        return full.toString();
    }
}
