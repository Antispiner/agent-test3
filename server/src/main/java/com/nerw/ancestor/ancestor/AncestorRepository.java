package com.nerw.ancestor.ancestor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class AncestorRepository {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final TypeReference<List<String>> STR_LIST = new TypeReference<>() {};

    private final String jdbcUrl;

    public AncestorRepository(@Value("${db.path}") String dbPath) {
        this.jdbcUrl = buildJdbcUrl(dbPath);
    }

    static String buildJdbcUrl(String dbPath) {
        if (dbPath == null || dbPath.isBlank() || ":memory:".equals(dbPath)) {
            return "jdbc:sqlite::memory:";
        }
        File f = new File(dbPath);
        File parent = f.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }
        return "jdbc:sqlite:" + dbPath;
    }

    @PostConstruct
    public void init() {
        try (Connection c = connect(); Statement s = c.createStatement()) {
            s.execute("""
                    CREATE TABLE IF NOT EXISTS ancestors (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        relation TEXT,
                        birth_year INTEGER,
                        death_year INTEGER,
                        birthplace TEXT,
                        profession TEXT,
                        language TEXT,
                        life_events TEXT,
                        personality_traits TEXT,
                        historical_context TEXT,
                        photo_url TEXT
                    )
                    """);
            s.execute("""
                    CREATE TABLE IF NOT EXISTS messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        ancestor_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        content TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    )
                    """);
        } catch (SQLException e) {
            throw new IllegalStateException("Failed to init DB schema", e);
        }
    }

    public Connection connect() throws SQLException {
        return DriverManager.getConnection(jdbcUrl);
    }

    public Ancestor create(Ancestor a) {
        String id = a.id() != null ? a.id() : UUID.randomUUID().toString();
        Ancestor toSave = new Ancestor(
                id, a.name(), a.relation(), a.birthYear(), a.deathYear(),
                a.birthplace(), a.profession(), a.language(),
                a.lifeEvents(), a.personalityTraits(), a.historicalContext(),
                a.photoUrl()
        );
        try (Connection c = connect();
             PreparedStatement ps = c.prepareStatement(
                     "INSERT INTO ancestors VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")) {
            ps.setString(1, toSave.id());
            ps.setString(2, toSave.name());
            ps.setString(3, toSave.relation());
            setNullableInt(ps, 4, toSave.birthYear());
            setNullableInt(ps, 5, toSave.deathYear());
            ps.setString(6, toSave.birthplace());
            ps.setString(7, toSave.profession());
            ps.setString(8, toSave.language());
            ps.setString(9, encode(toSave.lifeEvents()));
            ps.setString(10, encode(toSave.personalityTraits()));
            ps.setString(11, encode(toSave.historicalContext()));
            ps.setString(12, toSave.photoUrl());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("Failed to create ancestor", e);
        }
        return toSave;
    }

    public List<Ancestor> findAll() {
        List<Ancestor> out = new ArrayList<>();
        try (Connection c = connect();
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("SELECT * FROM ancestors ORDER BY name")) {
            while (rs.next()) {
                out.add(map(rs));
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Failed to list ancestors", e);
        }
        return out;
    }

    public Optional<Ancestor> findById(String id) {
        try (Connection c = connect();
             PreparedStatement ps = c.prepareStatement("SELECT * FROM ancestors WHERE id = ?")) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(map(rs));
                }
                return Optional.empty();
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Failed to fetch ancestor", e);
        }
    }

    public boolean delete(String id) {
        try (Connection c = connect()) {
            c.setAutoCommit(false);
            try (PreparedStatement m = c.prepareStatement("DELETE FROM messages WHERE ancestor_id = ?");
                 PreparedStatement a = c.prepareStatement("DELETE FROM ancestors WHERE id = ?")) {
                m.setString(1, id);
                m.executeUpdate();
                a.setString(1, id);
                int n = a.executeUpdate();
                c.commit();
                return n > 0;
            } catch (SQLException e) {
                c.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Failed to delete ancestor", e);
        }
    }

    private Ancestor map(ResultSet rs) throws SQLException {
        return new Ancestor(
                rs.getString("id"),
                rs.getString("name"),
                rs.getString("relation"),
                getNullableInt(rs, "birth_year"),
                getNullableInt(rs, "death_year"),
                rs.getString("birthplace"),
                rs.getString("profession"),
                rs.getString("language"),
                decode(rs.getString("life_events")),
                decode(rs.getString("personality_traits")),
                decode(rs.getString("historical_context")),
                rs.getString("photo_url")
        );
    }

    private static void setNullableInt(PreparedStatement ps, int idx, Integer v) throws SQLException {
        if (v == null) {
            ps.setNull(idx, java.sql.Types.INTEGER);
        } else {
            ps.setInt(idx, v);
        }
    }

    private static Integer getNullableInt(ResultSet rs, String col) throws SQLException {
        int v = rs.getInt(col);
        return rs.wasNull() ? null : v;
    }

    private static String encode(List<String> list) {
        if (list == null) return null;
        try {
            return JSON.writeValueAsString(list);
        } catch (Exception e) {
            return null;
        }
    }

    private static List<String> decode(String s) {
        if (s == null || s.isBlank()) return List.of();
        try {
            return JSON.readValue(s, STR_LIST);
        } catch (Exception e) {
            return List.of();
        }
    }
}
