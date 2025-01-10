package com.surge.backend.filter;

import com.surge.backend.util.TokenUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.UserDetailsManager;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private final TokenUtil jwtTokenUtil;

    private final UserDetailsManager userDetailsManager;

    private static final String JWT_COOKIE_NAME = "jwt";

    public JwtRequestFilter(TokenUtil jwtTokenUtil, UserDetailsManager userDetailsManager) {
        this.jwtTokenUtil = jwtTokenUtil;
        this.userDetailsManager = userDetailsManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String jwtToken = extractTokenFromCookie(request);
        String username = null;

        if (jwtToken != null) {
            try {
                username = jwtTokenUtil.getUsernameFromToken(jwtToken);
            } catch (IllegalArgumentException e) {
                sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Unable to get JWT Token");
                return;
            } catch (ExpiredJwtException e) {
                sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "JWT Token has expired");
                return;
            } catch (MalformedJwtException e) {
                sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token");
                return;
            } catch (Exception e) {
                sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "An error occurred processing the token");
                return;
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsManager.loadUserByUsername(username);

            if (jwtTokenUtil.validateToken(jwtToken, userDetails)) {
                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                usernamePasswordAuthenticationToken
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
            }
        }
        chain.doFilter(request, response);
    }

    private String extractTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                System.out.printf("Cookie Name: %s, Value: %s%n", cookie.getName(), cookie.getValue());
                if (JWT_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private void sendErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        String jsonResponse = String.format("{\"error\": \"%s\"}", message);
        response.getWriter().write(jsonResponse);
    }
}
