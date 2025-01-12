package com.surge.backend.dao;

import com.surge.backend.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostDao extends JpaRepository<Post, Long> {
    List<Post> findAllByUser_UserIdOrderByCreatedAtDesc(String userId);
    List<Post> findAllByOrderByCreatedAtDesc();

    @Query("SELECT p FROM Post p LEFT JOIN p.likes l GROUP BY p ORDER BY COUNT(l) DESC, p.createdAt DESC")
    List<Post> findAllOrderByLikesAndCreatedAt();

    List<Post> findAllBySaves_User_UserIdOrderBySaves_CreatedAtDesc(String userId);
}
