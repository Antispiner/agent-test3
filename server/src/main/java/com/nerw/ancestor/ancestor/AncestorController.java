package com.nerw.ancestor.ancestor;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ancestors")
public class AncestorController {

    private final AncestorRepository repo;

    public AncestorController(AncestorRepository repo) {
        this.repo = repo;
    }

    public record AncestorRequest(
            String name,
            String relation,
            @JsonProperty("birth_year") Integer birthYear,
            @JsonProperty("death_year") Integer deathYear,
            String birthplace,
            String profession,
            String language,
            @JsonProperty("life_events") List<String> lifeEvents,
            @JsonProperty("personality_traits") List<String> personalityTraits,
            @JsonProperty("historical_context") List<String> historicalContext,
            @JsonProperty("photo_url") String photoUrl
    ) {
        Ancestor toAncestor() {
            return new Ancestor(null, name, relation, birthYear, deathYear,
                    birthplace, profession, language,
                    lifeEvents, personalityTraits, historicalContext, photoUrl);
        }
    }

    public record AncestorResponse(
            String id,
            String name,
            String relation,
            @JsonProperty("birth_year") Integer birthYear,
            @JsonProperty("death_year") Integer deathYear,
            String birthplace,
            String profession,
            String language,
            @JsonProperty("life_events") List<String> lifeEvents,
            @JsonProperty("personality_traits") List<String> personalityTraits,
            @JsonProperty("historical_context") List<String> historicalContext,
            @JsonProperty("photo_url") String photoUrl
    ) {
        static AncestorResponse from(Ancestor a) {
            return new AncestorResponse(
                    a.id(), a.name(), a.relation(), a.birthYear(), a.deathYear(),
                    a.birthplace(), a.profession(), a.language(),
                    a.lifeEvents(), a.personalityTraits(), a.historicalContext(),
                    a.photoUrl());
        }
    }

    @PostMapping
    public ResponseEntity<AncestorResponse> create(@RequestBody AncestorRequest req) {
        Ancestor saved = repo.create(req.toAncestor());
        return ResponseEntity.status(HttpStatus.CREATED).body(AncestorResponse.from(saved));
    }

    @GetMapping
    public List<AncestorResponse> list() {
        return repo.findAll().stream().map(AncestorResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AncestorResponse> get(@PathVariable String id) {
        return repo.findById(id)
                .map(a -> ResponseEntity.ok(AncestorResponse.from(a)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        boolean removed = repo.delete(id);
        return removed ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
