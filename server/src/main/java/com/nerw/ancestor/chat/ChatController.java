package com.nerw.ancestor.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nerw.ancestor.ancestor.Ancestor;
import com.nerw.ancestor.ancestor.AncestorRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final AncestorRepository ancestors;
    private final MessageRepository messages;
    private final PersonaPromptBuilder personaBuilder;
    private final AnthropicClient anthropic;
    private final ExecutorService streamExecutor =
            Executors.newCachedThreadPool(r -> {
                Thread t = new Thread(r, "chat-stream");
                t.setDaemon(true);
                return t;
            });

    public ChatController(AncestorRepository ancestors,
                          MessageRepository messages,
                          PersonaPromptBuilder personaBuilder,
                          AnthropicClient anthropic) {
        this.ancestors = ancestors;
        this.messages = messages;
        this.personaBuilder = personaBuilder;
        this.anthropic = anthropic;
    }

    public record ChatRequest(String message) {}

    @PostMapping(value = "/{id}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Object chat(@PathVariable String id, @RequestBody ChatRequest req, HttpServletResponse response) {
        Optional<Ancestor> found = ancestors.findById(id);
        if (found.isEmpty()) {
            return ResponseEntity.status(404)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "ancestor not found"));
        }
        if (!anthropic.isConfigured()) {
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "ANTHROPIC_API_KEY not configured"));
        }

        Ancestor ancestor = found.get();
        String userMsg = req.message() == null ? "" : req.message();

        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");

        SseEmitter emitter = new SseEmitter(0L);
        List<Message> history = messages.history(id);
        messages.append(id, "user", userMsg);

        streamExecutor.submit(() -> {
            try {
                String system = personaBuilder.build(ancestor);
                String full = anthropic.streamMessage(system, history, userMsg, chunk -> {
                    sendEvent(emitter, Map.of("type", "chunk", "text", chunk));
                });
                messages.append(id, "ancestor", full);
                sendEvent(emitter, Map.of("type", "done"));
                emitter.complete();
            } catch (Exception e) {
                try {
                    sendEvent(emitter, Map.of("type", "error", "message", e.getMessage() == null ? "stream error" : e.getMessage()));
                } catch (Exception ignore) {
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<?> history(@PathVariable String id) {
        if (ancestors.findById(id).isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "ancestor not found"));
        }
        return ResponseEntity.ok(messages.history(id));
    }

    private static void sendEvent(SseEmitter emitter, Map<String, ?> payload) {
        try {
            String json = JSON.writeValueAsString(payload);
            emitter.send(SseEmitter.event().data(json, MediaType.APPLICATION_JSON));
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
