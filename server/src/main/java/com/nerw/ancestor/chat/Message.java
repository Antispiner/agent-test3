package com.nerw.ancestor.chat;

import com.fasterxml.jackson.annotation.JsonProperty;

public record Message(
        String role,
        String content,
        @JsonProperty("created_at") String createdAt
) {
}
