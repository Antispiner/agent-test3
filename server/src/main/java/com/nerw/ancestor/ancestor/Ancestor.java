package com.nerw.ancestor.ancestor;

import java.util.List;

public record Ancestor(
        String id,
        String name,
        String relation,
        Integer birthYear,
        Integer deathYear,
        String birthplace,
        String profession,
        String language,
        List<String> lifeEvents,
        List<String> personalityTraits,
        List<String> historicalContext,
        String photoUrl
) {
}
