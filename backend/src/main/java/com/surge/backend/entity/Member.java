package com.surge.backend.entity;

import jakarta.persistence.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "members")
public class Member {
    @Id
    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(name = "pw", length = 68, nullable = false)
    private String password;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "email", unique = true)
    private String email;
    @Column(name = "img_src")
    private String file;
    @Column(name = "first_name")
    private String firstName;
    @Column(name = "last_name")
    private String lastName;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<Role> roles = new HashSet<>();

    public Member() {
    }

    public Member(String userId, String password, boolean active, String email, String file, String firstName, String lastName, Set<Role> roles) {
        this.userId = userId;
        this.password = password;
        this.active = active;
        this.email = email;
        this.file = file;
        this.firstName = firstName;
        this.lastName = lastName;
        this.roles = roles;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFile() {
        return file;
    }

    public void setFile(String file) {
        this.file = file;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }
}
