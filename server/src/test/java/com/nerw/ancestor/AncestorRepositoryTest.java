package com.nerw.ancestor;

import com.nerw.ancestor.ancestor.Ancestor;
import com.nerw.ancestor.ancestor.AncestorRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AncestorRepositoryTest {

    private Path dbFile;
    private AncestorRepository repo;

    @BeforeEach
    void setup() throws Exception {
        dbFile = Files.createTempFile("ancestors-test", ".db");
        Files.deleteIfExists(dbFile);
        repo = new AncestorRepository(dbFile.toString());
        repo.init();
    }

    @AfterEach
    void cleanup() throws Exception {
        Files.deleteIfExists(dbFile);
    }

    @Test
    void crudSmoke() {
        Ancestor a = new Ancestor(
                null, "Babcia Anna", "grandmother", 1910, 1985,
                "Krakow", "seamstress", "Polish",
                List.of("WW2 survivor", "moved to Warsaw"),
                List.of("warm", "stoic"),
                List.of("WWII", "post-war Poland"),
                null);

        Ancestor saved = repo.create(a);
        assertNotNull(saved.id());
        assertEquals("Babcia Anna", saved.name());

        List<Ancestor> all = repo.findAll();
        assertEquals(1, all.size());

        Optional<Ancestor> fetched = repo.findById(saved.id());
        assertTrue(fetched.isPresent());
        assertEquals("seamstress", fetched.get().profession());
        assertEquals(2, fetched.get().lifeEvents().size());
        assertEquals(1910, fetched.get().birthYear());

        assertTrue(repo.delete(saved.id()));
        assertFalse(repo.findById(saved.id()).isPresent());
        assertEquals(0, repo.findAll().size());
    }
}
