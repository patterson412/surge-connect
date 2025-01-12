package com.surge.backend.dao;

import com.surge.backend.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LikeDao extends JpaRepository<Like, Long> {
    boolean existsByPost_IdAndUser_UserId(Long postId, String userId);
    void deleteByPost_IdAndUser_UserId(Long postId, String userId);
    @Query("SELECT COALESCE(COUNT(*), 0) FROM Like l WHERE l.post.id = :postId")
    int getTotalLikesForPost(@Param("postId") Long postId);
}
