package com.surge.backend.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class TokenUtil {
    private static final Logger logger = LoggerFactory.getLogger(TokenUtil.class);
    public static final long JWT_TOKEN_VALIDITY = 7 * 60 * 60; // 7 hours

    @Value("${jwt.secret}")
    private String secret;

    private Key key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String getUsernameFromToken(String token) {
        return (String) getClaimFromToken(token, "sub");
    }

    public Date getExpirationDateFromToken(String token) {
        Number expiration = (Number) getClaimFromToken(token, "exp");
        return new Date(expiration.longValue() * 1000);
    }

    public Object getClaimFromToken(String token, String claimName) {
        final Claims claims = getAllClaimsFromToken(token);
        return claims.get(claimName);
    }

    private Claims getAllClaimsFromToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException e) {
            logger.error("Failed to parse JWT token", e);
            throw e;
        }
    }

    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();   // For any custom claims, if needed can add them, for now it is empty
        return doGenerateToken(claims, userDetails.getUsername());
    }

    private String doGenerateToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))  // Stores in seconds, as jwt library will internally convert milliseconds to seconds
                .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY * 1000))
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = getUsernameFromToken(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (JwtException e) {
            logger.error("Invalid JWT token", e);
            return false;
        }
    }

    public ResponseCookie refreshToken(UserDetails userDetails) {
        String token = generateToken(userDetails);
        return ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false)  // Set to true in production to use https
                .path("/")
                .maxAge(7 * 60 * 60) // 7 hours in seconds
                .sameSite("Strict")
                .build();
    }
}
