package com.surge.backend.service;

import com.surge.backend.dao.MemberDao;
import com.surge.backend.dto.RegisterFormDto;
import com.surge.backend.entity.Member;
import jakarta.validation.ValidationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.UserDetailsManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class MemberService {
    private final MemberDao memberDao;

    private final UserDetailsManager userDetailsManager;
    private final PasswordEncoder passwordEncoder;

    private final S3Service s3Service;

    public MemberService(MemberDao memberDao, UserDetailsManager userDetailsManager, PasswordEncoder passwordEncoder, S3Service s3Service) {
        this.memberDao = memberDao;
        this.userDetailsManager = userDetailsManager;
        this.passwordEncoder = passwordEncoder;
        this.s3Service = s3Service;
    }

    private String getStringValueWithoutSpaces(String value) {
        return value.trim().replaceAll("\\s", "");
    }

    @Transactional
    public Member createUser(RegisterFormDto dto) {
        if (memberDao.existsById(dto.getUsername().trim())) {
            throw new DuplicateKeyException("The username already exists");
        }
        if (memberDao.existsByEmail(dto.getEmail().trim())) {
            throw new DuplicateKeyException("The email already exists");
        }

        UserDetails userDetails = User.builder()
                .username(dto.getUsername().trim())
                .password(passwordEncoder.encode(dto.getPassword().trim()))
                .roles("USER")
                .disabled(false)
                .build();

        userDetailsManager.createUser(userDetails);

        Member newUser = memberDao.findById(dto.getUsername().trim()).orElseThrow(() -> new ValidationException("Could not find created user, please contact support"));

        newUser.setEmail(dto.getEmail().trim());
        newUser.setFirstName(dto.getFirstName().trim());
        newUser.setLastName(dto.getLastName().trim());
        if (dto.getFile() != null) {
            String newImgUrl = s3Service.uploadFile(dto.getFile(), S3Service.ImageType.PROFILE_PHOTO, newUser.getUserId());
            newUser.setFile(newImgUrl);
        }

        return memberDao.save(newUser);

    }

    public Member getUser(String username) {
        return memberDao.findById(username.trim()).orElseThrow(() -> new ValidationException("Cannot find user with username: " + username.trim()));
    }

    @Transactional
    public void changeUserRole(String username, String newRole) {
        UserDetails existingUser = userDetailsManager.loadUserByUsername(username);
        UserDetails updatedUser = User.builder()
                .username(existingUser.getUsername())
                .password(existingUser.getPassword())
                .roles(newRole)
                .disabled(!existingUser.isEnabled())
                .build();

        userDetailsManager.updateUser(updatedUser);
    }

    @Transactional
    public Map<String, String> getUserProfile(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username to get profile data cannot be null");
        }
        Member user = memberDao.findById(username.trim()).orElseThrow(() -> new ValidationException("Cannot find user with username: " + username.trim()));

        return Map.of(
                "profilePic", s3Service.generatePreSignedUrl(user.getFile()),
                "username", user.getUserId(),
                "fullName", user.getFirstName() + " " + user.getLastName()
        );

    }




}
