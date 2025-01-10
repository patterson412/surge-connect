package com.surge.backend.controller;

import com.surge.backend.entity.Member;
import com.surge.backend.service.MemberService;
import com.surge.backend.service.S3Service;
import com.surge.backend.util.TokenUtil;
import jakarta.validation.ValidationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {
    private final MemberService memberService;
    private final TokenUtil jwtTokenUtil;
    private final S3Service s3Service;

    public UserController(MemberService memberService, TokenUtil jwtTokenUtil, S3Service s3Service) {
        this.memberService = memberService;
        this.jwtTokenUtil = jwtTokenUtil;
        this.s3Service = s3Service;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getUser() {
        UserDetails currentUser = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Member user = memberService.getUser(currentUser.getUsername());

        ResponseCookie jwtCookie = jwtTokenUtil.refreshToken(currentUser);

        return ResponseEntity
                .ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(Map.of(
                        "username", user.getUserId(),
                        "fullName", user.getFirstName() + " " + user.getLastName(),
                        "profilePic", user.getFile() != null ? s3Service.generatePreSignedUrl(user.getFile()) : ""
                ));

    }
}
