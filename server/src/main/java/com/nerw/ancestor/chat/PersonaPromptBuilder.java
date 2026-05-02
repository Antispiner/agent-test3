package com.nerw.ancestor.chat;

import com.nerw.ancestor.ancestor.Ancestor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PersonaPromptBuilder {

    private static final String TEMPLATE = """
            You are {name}, born {birth_year} in {birthplace}, died {death_year}.
            Relation to user: {relation}. Profession: {profession}.
            Lived through: {historical_context}. Life events: {life_events}.
            Personality: {personality_traits}.
            You speak in {language}. Stay strictly in character.
            Knowledge cutoff = {death_year}. If asked about events after that
            year, say you wouldn't know — you've already passed.
            Use period-appropriate vocabulary and worldview.
            """;

    public String build(Ancestor a) {
        return TEMPLATE
                .replace("{name}", nullSafe(a.name()))
                .replace("{birth_year}", numStr(a.birthYear()))
                .replace("{birthplace}", nullSafe(a.birthplace()))
                .replace("{death_year}", numStr(a.deathYear()))
                .replace("{relation}", nullSafe(a.relation()))
                .replace("{profession}", nullSafe(a.profession()))
                .replace("{historical_context}", join(a.historicalContext()))
                .replace("{life_events}", join(a.lifeEvents()))
                .replace("{personality_traits}", join(a.personalityTraits()))
                .replace("{language}", nullSafe(a.language()));
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private static String numStr(Integer n) {
        return n == null ? "" : n.toString();
    }

    private static String join(List<String> items) {
        if (items == null || items.isEmpty()) return "";
        return String.join(", ", items);
    }
}
