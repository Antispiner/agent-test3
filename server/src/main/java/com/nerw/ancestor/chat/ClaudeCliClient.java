package com.nerw.ancestor.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

@Component
public class ClaudeCliClient {

    private static final Logger LOG = LoggerFactory.getLogger(ClaudeCliClient.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    @FunctionalInterface
    public interface ProcessFactory {
        Process spawn(List<String> command) throws IOException;
    }

    private final ProcessFactory factory;
    private final String binary;

    public ClaudeCliClient() {
        this(defaultFactory(), discoverBinary());
    }

    public ClaudeCliClient(ProcessFactory factory, String binary) {
        this.factory = factory;
        this.binary = binary;
    }

    public String getBinary() {
        return binary;
    }

    /**
     * Spawn `claude -p --output-format stream-json` and stream assistant text deltas.
     * Returns full assembled response. Throws on CLI failure.
     */
    public String streamChat(String systemPrompt, List<Message> history, String userMsg, Consumer<String> onChunk) {
        List<String> cmd = new ArrayList<>(List.of(
                binary,
                "-p",
                "--output-format", "stream-json",
                "--verbose",
                "--max-turns", "1"
        ));
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            cmd.add("--append-system-prompt");
            cmd.add(systemPrompt);
        }

        Process proc;
        try {
            proc = factory.spawn(cmd);
        } catch (IOException e) {
            throw new ClaudeCliException("Failed to spawn claude CLI: " + e.getMessage(), e);
        }

        Thread stderrDrain = new Thread(() -> drainStderr(proc.getErrorStream()), "claude-stderr");
        stderrDrain.setDaemon(true);
        stderrDrain.start();

        try (OutputStream stdin = proc.getOutputStream()) {
            stdin.write(buildPrompt(history, userMsg).getBytes(StandardCharsets.UTF_8));
            stdin.flush();
        } catch (IOException e) {
            throw new ClaudeCliException("Failed to write to claude stdin: " + e.getMessage(), e);
        }

        StringBuilder full = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(proc.getInputStream(), StandardCharsets.UTF_8))) {
            parseStream(r, chunk -> {
                full.append(chunk);
                onChunk.accept(chunk);
            });
        } catch (IOException e) {
            throw new ClaudeCliException("Failed reading claude stdout: " + e.getMessage(), e);
        }

        try {
            proc.waitFor();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            proc.destroy();
            throw new ClaudeCliException("Interrupted waiting for claude CLI", e);
        }

        if (proc.exitValue() != 0 && full.length() == 0) {
            throw new ClaudeCliException("claude CLI exited with code " + proc.exitValue());
        }
        return full.toString();
    }

    static void parseStream(BufferedReader stdout, Consumer<String> onChunk) throws IOException {
        String line;
        while ((line = stdout.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;

            JsonNode evt;
            try {
                evt = JSON.readTree(line);
            } catch (IOException parseErr) {
                LOG.warn("Skipping non-JSON line from claude CLI: {}", line);
                continue;
            }

            String type = evt.path("type").asText("");
            if ("assistant".equals(type)) {
                JsonNode contents = evt.path("message").path("content");
                if (contents.isArray()) {
                    for (JsonNode c : contents) {
                        if ("text".equals(c.path("type").asText(""))) {
                            String text = c.path("text").asText("");
                            if (!text.isEmpty()) {
                                onChunk.accept(text);
                            }
                        }
                    }
                }
            } else if ("result".equals(type)) {
                break;
            }
        }
    }

    static String buildPrompt(List<Message> history, String userMsg) {
        StringBuilder sb = new StringBuilder();
        if (history != null) {
            for (Message m : history) {
                String role = "ancestor".equals(m.role()) ? "Ancestor" : "User";
                sb.append(role).append(": ").append(m.content()).append("\n");
            }
        }
        sb.append("User: ").append(userMsg == null ? "" : userMsg).append("\n");
        return sb.toString();
    }

    private static void drainStderr(InputStream err) {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(err, StandardCharsets.UTF_8))) {
            String line;
            while ((line = r.readLine()) != null) {
                LOG.info("claude stderr: {}", line);
            }
        } catch (IOException ignored) {
        }
    }

    private static ProcessFactory defaultFactory() {
        return command -> new ProcessBuilder(command)
                .redirectErrorStream(false)
                .start();
    }

    static String discoverBinary() {
        String env = System.getenv("CLAUDE_CMD");
        if (env != null && !env.isBlank()) {
            return env;
        }
        List<String> candidates = List.of(
                "/opt/homebrew/lib/node_modules/@anthropic-ai/claude-code/bin/claude.exe",
                "/usr/local/lib/node_modules/@anthropic-ai/claude-code/bin/claude.exe",
                "/opt/homebrew/bin/claude",
                "/usr/local/bin/claude"
        );
        for (String p : candidates) {
            if (Files.isExecutable(Path.of(p))) {
                return p;
            }
        }
        return "claude";
    }

    public static class ClaudeCliException extends RuntimeException {
        public ClaudeCliException(String msg) { super(msg); }
        public ClaudeCliException(String msg, Throwable t) { super(msg, t); }
    }
}
