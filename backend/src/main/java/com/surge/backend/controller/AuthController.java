package com.surge.backend.controller;

import com.surge.backend.dto.LoginFormDto;
import com.surge.backend.dto.RegisterFormDto;
import com.surge.backend.entity.Member;
import com.surge.backend.service.MemberService;
import com.surge.backend.util.TokenUtil;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.UserDetailsManager;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final TokenUtil jwtTokenUtil;
    private final UserDetailsManager userDetailsManager;
    private final MemberService memberService;

    public AuthController(AuthenticationManager authenticationManager,
                          TokenUtil jwtTokenUtil,
                          UserDetailsManager userDetailsManager,
                          MemberService memberService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenUtil = jwtTokenUtil;
        this.userDetailsManager = userDetailsManager;
        this.memberService = memberService;
    }


    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginFormDto loginFormDto) throws Exception {
        authenticate(loginFormDto.getUsername(), loginFormDto.getPassword());
        final UserDetails userDetails = userDetailsManager.loadUserByUsername(loginFormDto.getUsername());
        final String token = jwtTokenUtil.generateToken(userDetails);

        // Create cookie
        ResponseCookie jwtCookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false)   // Should be set to true in production to use https
                .path("/")
                .maxAge(7 * 60 * 60) // 7 hours in seconds
                .sameSite("Strict")
                .build();

        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("status", "success");
        responseBody.put("message", "Login successful");
        responseBody.put("username", userDetails.getUsername());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add(HttpHeaders.SET_COOKIE, jwtCookie.toString());


        return ResponseEntity
                .status(HttpStatus.OK)
                .headers(headers)
                .body(responseBody);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        ResponseCookie jwtCookie = ResponseCookie.from("jwt", "")   // Set to the same name as the cookie that was created to override it
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)  // Causes the cookie to immediately expire
                .sameSite("Strict")
                .build();

        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("status", "success");
        responseBody.put("message", "Logged out successfully");

        return ResponseEntity
                .ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(responseBody);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterFormDto registerFormDto) {

        Member savedUser = memberService.createUser(registerFormDto);

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("status", "success");
        responseBody.put("message", "User registered successfully");
        responseBody.put("data", Map.of(
                "userId", savedUser.getUserId(),
                "email", savedUser.getEmail()
        ));

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(responseBody);

    }


    private void authenticate(String username, String password) throws Exception {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
        } catch (DisabledException e) {
            throw new Exception("USER_DISABLED", e);
        } catch (BadCredentialsException e) {
            throw new Exception("INVALID_CREDENTIALS", e);
        }
    }

}

