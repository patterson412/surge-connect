package com.surge.backend.dao;

import com.surge.backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentDao extends JpaRepository<Comment, Long> {
    List<Comment> findAllByPost_IdAndParentIsNullOrderByCreatedAtDesc(Long postId);
    @Query("SELECT COALESCE(COUNT(*), 0) FROM Comment c WHERE c.post.id = :postId")
    int getTotalCommentsForPost(@Param("postId") Long postId);
}
