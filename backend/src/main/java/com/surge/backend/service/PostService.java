package com.surge.backend.service;

import com.surge.backend.util.TimeFormatter;
import com.surge.backend.dao.*;
import com.surge.backend.dto.CommentNewDto;
import com.surge.backend.dto.PostNewDto;
import com.surge.backend.entity.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class PostService {
    private final PostDao postDao;
    private final MemberDao memberDao;
    private final SaveDao saveDao;
    private final LikeDao likeDao;
    private final CommentDao commentDao;
    private final MemberService memberService;
    private final S3Service s3Service;
    private final TimeFormatter timeFormatter;

    public PostService(PostDao postDao, MemberDao memberDao, SaveDao saveDao, LikeDao likeDao, CommentDao commentDao, MemberService memberService, S3Service s3Service, TimeFormatter timeFormatter) {
        this.postDao = postDao;
        this.memberDao = memberDao;
        this.saveDao = saveDao;
        this.likeDao = likeDao;
        this.commentDao = commentDao;
        this.memberService = memberService;
        this.s3Service = s3Service;
        this.timeFormatter = timeFormatter;
    }

    // Create new Post
    @Transactional
    public Post addPost(PostNewDto dto) {
        UserDetails currentUser = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Member user = memberService.getUser(currentUser.getUsername());

        Post newPost = new Post();

        String newPostImg = s3Service.uploadFile(dto.getFile(), S3Service.ImageType.PROFILE_POSTS, user.getUserId());

        newPost.setFile(newPostImg);
        newPost.setCaption(dto.getCaption().trim());
        newPost.setUser(user);

        return postDao.save(newPost);

    }

    // Delete existing Post
    @Transactional
    public void deletePost(Long postId) {
        UserDetails currentUser = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Member user = memberService.getUser(currentUser.getUsername());

        Post post = postDao.findById(postId).orElseThrow(() -> new NoSuchElementException("Could not find post with Id: " + postId));

        if (!user.getUserId().equals(post.getUser().getUserId())) {
            throw new IllegalArgumentException("This post requested to delete does not belong to the user with username: " + user.getUserId());
        }

        postDao.delete(post);
    }

    // Add a new Comment for a Post or a reply for an already existing comment
    @Transactional
    public Comment addComment(CommentNewDto dto, Long postId) {
        UserDetails currentUser = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Member user = memberService.getUser(currentUser.getUsername());

        Post post = postDao.findById(postId).orElseThrow(() -> new NoSuchElementException("Could not find post with Id: " + postId));

        Comment newComment = new Comment();
        newComment.setPost(post);
        newComment.setContent(dto.getComment());
        newComment.setUser(user);

        if (dto.getReplyTo() != null) {
            Comment replyTo = commentDao.findById(dto.getReplyTo()).orElseThrow(() -> new NoSuchElementException("Could not find comment with Id: " + dto.getReplyTo()));
            newComment.setParent(replyTo);
        }

        return commentDao.save(newComment);
    }


    // Delete existing Comment
    @Transactional
    public void deleteComment(Long commentId) {
        UserDetails currentUser = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Member user = memberService.getUser(currentUser.getUsername());

        Comment comment = commentDao.findById(commentId).orElseThrow(() -> new NoSuchElementException("Could not find comment with Id: " + commentId));

        if (!comment.getUser().getUserId().equals(user.getUserId())) {
            throw new IllegalArgumentException("This comment requested to delete does not belong to the user with username: " + user.getUserId());
        }

        commentDao.delete(comment);
    }

    @Transactional
    public List<Map<String, Object>> getAllCommentsForPost(Long postId) {
        Post post = postDao.findById(postId)
                .orElseThrow(() -> new NoSuchElementException("Could not find post with Id: " + postId));

        List<Comment> parentComments = commentDao.findAllByPost_IdAndParentIsNullOrderByCreatedAtDesc(post.getId());

        return parentComments.stream()
                .map(this::convertCommentToMap)
                .toList();
    }

    private Map<String, Object> convertCommentToMap(Comment comment) {
        Map<String, Object> commentMap = new HashMap<>();
        commentMap.put("id", comment.getId());
        commentMap.put("text", comment.getContent());

        // Recursively convert replies
        List<Map<String, Object>> repliesMap = comment.getReplies().stream()
                .map(this::convertCommentToMap)
                .toList();

        commentMap.put("replies", repliesMap);

        return commentMap;
    }

    // Add/Remove Like from Post (Toggle)
    @Transactional
    public HashMap<String, Object> toggleLike(Long postId) {
        UserDetails currentUser = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Member user = memberService.getUser(currentUser.getUsername());

        Post post = postDao.findById(postId).orElseThrow(() -> new NoSuchElementException("Could not find post with Id: " + postId));

        boolean liked = false;
        if (likeDao.existsByPost_IdAndUser_UserId(post.getId(), user.getUserId())){
            likeDao.deleteByPost_IdAndUser_UserId(post.getId(), user.getUserId());
        } else {
            Like newLike = new Like();
            newLike.setPost(post);
            newLike.setUser(user);
            likeDao.save(newLike);
            liked = true;
        }

        int likedCount = likeDao.getTotalLikesForPost(post.getId());

        return new HashMap<>(Map.of(
                "isNowLiked", liked,
                "likeCount", likedCount
        ));
    }

    // Add/Remove Save from Post (Toggle)
    @Transactional
    public boolean toggleSave(Long postId) {
        UserDetails currentUser = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Member user = memberService.getUser(currentUser.getUsername());

        Post post = postDao.findById(postId).orElseThrow(() -> new NoSuchElementException("Could not find post with Id: " + postId));

        if (saveDao.existsByPost_IdAndUser_UserId(post.getId(), user.getUserId())){
            saveDao.deleteByPost_IdAndUser_UserId(post.getId(), user.getUserId());
            return false;   // removed Save
        } else {
            Save newSave = new Save();
            newSave.setPost(post);
            newSave.setUser(user);
            saveDao.save(newSave);
            return true;    // added Save
        }
    }


    @Transactional
    public List<Map<String, Object>> getAllPosts() {
        UserDetails currentUser = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Member user = memberService.getUser(currentUser.getUsername());

        List<Post> posts = postDao.findAll();

        return posts.stream()
                .map(post -> {
                    Map<String, Object> postMap = new HashMap<>();
                    postMap.put("id", post.getId());
                    postMap.put("username", post.getUser().getUserId());
                    postMap.put("likeCount", likeDao.getTotalLikesForPost(post.getId()));
                    postMap.put("img", s3Service.generatePreSignedUrl(post.getFile()));
                    postMap.put("commentCount", commentDao.getTotalCommentsForPost(post.getId()));
                    postMap.put("isLiked", likeDao.existsByPost_IdAndUser_UserId(post.getId(), user.getUserId()));
                    postMap.put("isSaved", saveDao.existsByPost_IdAndUser_UserId(post.getId(), user.getUserId()));
                    postMap.put("caption", post.getCaption());
                    postMap.put("date", timeFormatter.toRelativeTime(post.getCreatedAt()));
                    return postMap;
                }).toList();
    }

}
