package com.surge.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CommentNewDto {
    @NotBlank(message = "The comment content is required")
    private String comment;
    private Long replyTo;

    public CommentNewDto() {
    }

    public CommentNewDto(String comment, Long replyTo) {
        this.comment = comment;
        this.replyTo = replyTo;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Long getReplyTo() {
        return replyTo;
    }

    public void setReplyTo(Long replyTo) {
        this.replyTo = replyTo;
    }
}
