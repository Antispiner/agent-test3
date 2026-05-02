package com.nerw.ancestor;

import com.nerw.ancestor.chat.ClaudeCliClient;
import com.nerw.ancestor.chat.Message;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClaudeCliClientTest {

    @Test
    void streamsAssistantTextDeltas() {
        String stdoutJsonl = String.join("\n",
                "{\"type\":\"system\",\"subtype\":\"init\"}",
                "{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"Hello\"}]}}",
                "{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\" child\"}]}}",
                "{\"type\":\"result\",\"subtype\":\"success\"}",
                ""
        );

        ByteArrayOutputStream stdinCapture = new ByteArrayOutputStream();
        FakeProcess fake = new FakeProcess(stdoutJsonl, "", 0, stdinCapture);

        List<List<String>> spawnedCommands = new ArrayList<>();
        ClaudeCliClient.ProcessFactory factory = cmd -> {
            spawnedCommands.add(cmd);
            return fake;
        };

        ClaudeCliClient client = new ClaudeCliClient(factory, "/fake/claude");

        List<String> chunks = new ArrayList<>();
        String full = client.streamChat(
                "You are Babcia.",
                List.of(new Message("user", "hi", "2026-01-01T00:00:00Z"),
                        new Message("ancestor", "hello", "2026-01-01T00:00:01Z")),
                "tell me a story",
                chunks::add
        );

        assertEquals(List.of("Hello", " child"), chunks);
        assertEquals("Hello child", full);

        assertEquals(1, spawnedCommands.size());
        List<String> cmd = spawnedCommands.get(0);
        assertEquals("/fake/claude", cmd.get(0));
        assertTrue(cmd.contains("-p"));
        assertTrue(cmd.contains("--output-format"));
        assertTrue(cmd.contains("stream-json"));
        assertTrue(cmd.contains("--max-turns"));
        assertTrue(cmd.contains("--append-system-prompt"));
        assertTrue(cmd.contains("You are Babcia."));

        String stdin = stdinCapture.toString(StandardCharsets.UTF_8);
        assertTrue(stdin.contains("User: hi"));
        assertTrue(stdin.contains("Ancestor: hello"));
        assertTrue(stdin.contains("User: tell me a story"));
    }

    private static final class FakeProcess extends Process {
        private final InputStream stdout;
        private final InputStream stderr;
        private final OutputStream stdin;
        private final int exit;

        FakeProcess(String stdoutText, String stderrText, int exit, OutputStream stdinSink) {
            this.stdout = new ByteArrayInputStream(stdoutText.getBytes(StandardCharsets.UTF_8));
            this.stderr = new ByteArrayInputStream(stderrText.getBytes(StandardCharsets.UTF_8));
            this.stdin = stdinSink;
            this.exit = exit;
        }

        @Override public OutputStream getOutputStream() { return stdin; }
        @Override public InputStream getInputStream() { return stdout; }
        @Override public InputStream getErrorStream() { return stderr; }
        @Override public int waitFor() { return exit; }
        @Override public boolean waitFor(long timeout, TimeUnit unit) { return true; }
        @Override public int exitValue() { return exit; }
        @Override public void destroy() {}
        @Override public Process destroyForcibly() { return this; }
    }
}
