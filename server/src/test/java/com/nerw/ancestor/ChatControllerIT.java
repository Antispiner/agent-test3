package com.nerw.ancestor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.nerw.ancestor.ancestor.Ancestor;
import com.nerw.ancestor.ancestor.AncestorRepository;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.options;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ChatControllerIT {

    private static final WireMockServer wireMock;
    private static final Path dbPath;

    static {
        wireMock = new WireMockServer(options().dynamicPort());
        wireMock.start();
        try {
            dbPath = Files.createTempFile("chat-it", ".db");
            Files.deleteIfExists(dbPath);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @LocalServerPort
    int port;

    @Autowired
    AncestorRepository ancestors;

    @AfterAll
    static void stop() throws Exception {
        if (wireMock != null) wireMock.stop();
        if (dbPath != null) Files.deleteIfExists(dbPath);
    }

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry reg) {
        reg.add("anthropic.api-url", () -> "http://localhost:" + wireMock.port());
        reg.add("anthropic.api-key", () -> "test-key");
        reg.add("db.path", () -> dbPath.toString());
    }

    @BeforeEach
    void resetMocks() {
        wireMock.resetAll();
    }

    @Test
    void streamsChunksAndPersistsHistory() throws Exception {
        String sseBody = """
                event: message_start
                data: {"type":"message_start"}

                event: content_block_delta
                data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

                event: content_block_delta
                data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":", dziecko"}}

                event: message_stop
                data: {"type":"message_stop"}

                """;

        wireMock.stubFor(post(urlEqualTo("/v1/messages"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("content-type", "text/event-stream")
                        .withBody(sseBody)));

        Ancestor saved = ancestors.create(new Ancestor(
                null, "TestAncestor", "grandparent", 1900, 1980,
                "Town", "teacher", "English",
                List.of("event1"), List.of("kind"), List.of("WW1"),
                null));

        HttpClient http = HttpClient.newHttpClient();

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/chat/" + saved.id()))
                .header("content-type", "application/json")
                .POST(BodyPublishers.ofString("{\"message\":\"hi\"}"))
                .build();

        HttpResponse<String> resp = http.send(req, BodyHandlers.ofString());

        assertEquals(200, resp.statusCode());
        String contentType = resp.headers().firstValue("Content-Type").orElse("");
        assertTrue(contentType.contains("text/event-stream"),
                "Expected text/event-stream, got: " + contentType);

        String body = resp.body();
        long chunkCount = body.lines().filter(l -> l.contains("\"type\":\"chunk\"")).count();
        long doneCount = body.lines().filter(l -> l.contains("\"type\":\"done\"")).count();
        assertTrue(chunkCount >= 1, "Expected at least one chunk event in body:\n" + body);
        assertEquals(1, doneCount, "Expected exactly one done event in body:\n" + body);

        HttpRequest histReq = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/chat/" + saved.id() + "/messages"))
                .GET()
                .build();
        HttpResponse<String> histResp = http.send(histReq, BodyHandlers.ofString());
        assertEquals(200, histResp.statusCode());

        List<Map<String, String>> rows = new ObjectMapper()
                .readValue(histResp.body(), new TypeReference<>() {});
        assertEquals(2, rows.size(), "Expected user + ancestor messages, got: " + histResp.body());
        assertEquals("user", rows.get(0).get("role"));
        assertEquals("ancestor", rows.get(1).get("role"));
        assertEquals("hi", rows.get(0).get("content"));
        assertTrue(rows.get(1).get("content").contains("Hello"),
                "Ancestor reply should contain streamed text, got: " + rows.get(1).get("content"));
    }
}
