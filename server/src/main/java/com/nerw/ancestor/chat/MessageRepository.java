package com.nerw.ancestor.chat;

import com.nerw.ancestor.ancestor.AncestorRepository;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Repository
public class MessageRepository {

    private final AncestorRepository ancestors;

    public MessageRepository(AncestorRepository ancestors) {
        this.ancestors = ancestors;
    }

    public void append(String ancestorId, String role, String content) {
        String now = Instant.now().toString();
        try (Connection c = ancestors.connect();
             PreparedStatement ps = c.prepareStatement(
                     "INSERT INTO messages (ancestor_id, role, content, created_at) VALUES (?,?,?,?)")) {
            ps.setString(1, ancestorId);
            ps.setString(2, role);
            ps.setString(3, content);
            ps.setString(4, now);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("Failed to append message", e);
        }
    }

    public List<Message> history(String ancestorId) {
        List<Message> out = new ArrayList<>();
        try (Connection c = ancestors.connect();
             PreparedStatement ps = c.prepareStatement(
                     "SELECT role, content, created_at FROM messages WHERE ancestor_id = ? ORDER BY id ASC")) {
            ps.setString(1, ancestorId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(new Message(rs.getString(1), rs.getString(2), rs.getString(3)));
                }
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Failed to load history", e);
        }
        return out;
    }
}
