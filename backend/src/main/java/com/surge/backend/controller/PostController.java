package com.surge.backend.controller;

import com.surge.backend.dto.CommentNewDto;
import com.surge.backend.dto.PostNewDto;
import com.surge.backend.entity.Comment;
import com.surge.backend.entity.Post;
import com.surge.backend.service.PostService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<?> getAllPosts() {
        List<Map<String, Object>> posts = postService.getAllPosts();
        return ResponseEntity.ok(posts);
    }

    @PostMapping
    public ResponseEntity<?> addPost(@Valid @ModelAttribute PostNewDto dto) {
        Post newPost = postService.addPost(dto);
        return ResponseEntity.ok(Map.of(
                "message", "Successfully added Post!"
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.ok(Map.of(
                "message", "Successfully deleted Post!"
        ));
    }

    @GetMapping("/comments/all/{postId}")
    public ResponseEntity<?> getComments(@PathVariable Long postId) {
        List<Map<String, Object>> comments = postService.getAllCommentsForPost(postId);
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/comments/add/{postId}")
    public ResponseEntity<?> addComment(@PathVariable Long postId,
                                        @Valid @RequestBody CommentNewDto dto) {
        Comment newComment = postService.addComment(dto, postId);
        return ResponseEntity.ok(Map.of(
                "message", "Successfully added Comment!"
        ));
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id) {
        postService.deleteComment(id);
        return ResponseEntity.ok(Map.of(
                "message", "Successfully deleted Comment!"
        ));
    }

    @PostMapping("/liked/toggle/{postId}")
    public ResponseEntity<?> toggleLike(@PathVariable Long postId) {
        Map<String, Object> response = postService.toggleLike(postId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/saved/toggle/{postId}")
    public ResponseEntity<?> toggleSave(@PathVariable Long postId) {
        boolean isSaved = postService.toggleSave(postId);
        return ResponseEntity.ok(Map.of(
                "isNowSaved", isSaved
        ));
    }



}
