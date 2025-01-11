package com.surge.backend.dao;

import com.surge.backend.entity.Save;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SaveDao extends JpaRepository<Save, Long> {
    boolean existsByPost_IdAndUser_UserId(Long postId, String userId);
    void deleteByPost_IdAndUser_UserId(Long postId, String userId);
}
