package com.surge.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "role")
public class Role {
    @EmbeddedId
    private RoleId id;

    @ManyToOne
    @MapsId("userId") // Reuses the userId from the composite key through the RoleId class.  ← Maps to RoleId.userId field. Avoids duplicating user_id column
    @JoinColumn(name = "user_id", referencedColumnName = "user_id")
    private Member user;

    public Role() {
    }

    public Role(RoleId id, Member user) {
        this.id = id;
        this.user = user;
    }

    public RoleId getId() {
        return id;
    }

    public void setId(RoleId id) {
        this.id = id;
    }

    public Member getUser() {
        return user;
    }

    public void setUser(Member user) {
        this.user = user;
    }
}


