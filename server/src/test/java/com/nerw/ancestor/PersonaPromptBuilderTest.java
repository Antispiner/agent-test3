package com.nerw.ancestor;

import com.nerw.ancestor.ancestor.Ancestor;
import com.nerw.ancestor.chat.PersonaPromptBuilder;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PersonaPromptBuilderTest {

    private final PersonaPromptBuilder builder = new PersonaPromptBuilder();

    @Test
    void allPlaceholdersReplaced() {
        Ancestor a = new Ancestor(
                "id-1", "Dziadek Jan", "grandfather", 1920, 1995,
                "Lublin", "carpenter", "Polish",
                List.of("WW2", "rebuilt town"),
                List.of("patient", "wise"),
                List.of("WWII", "communism", "Solidarity"),
                null);

        String prompt = builder.build(a);

        Pattern leftover = Pattern.compile("\\{[a-z_]+\\}");
        assertFalse(leftover.matcher(prompt).find(),
                "Prompt still contains unresolved placeholders: " + prompt);

        assertTrue(prompt.contains("Dziadek Jan"));
        assertTrue(prompt.contains("1920"));
        assertTrue(prompt.contains("1995"));
        assertTrue(prompt.contains("Lublin"));
        assertTrue(prompt.contains("carpenter"));
        assertTrue(prompt.contains("WWII, communism, Solidarity"));
        assertTrue(prompt.contains("patient, wise"));
        assertTrue(prompt.contains("Polish"));
        assertTrue(prompt.contains("Knowledge cutoff = 1995"));
    }
}
