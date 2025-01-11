package com.surge.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

public class PostNewDto {
    @NotNull(message = "The Post Image is required")
    private MultipartFile file;
    @NotBlank(message = "The Caption for the post is required")
    private String caption;

    public PostNewDto() {
    }

    public PostNewDto(MultipartFile file, String caption) {
        this.file = file;
        this.caption = caption;
    }

    public MultipartFile getFile() {
        return file;
    }

    public void setFile(MultipartFile file) {
        this.file = file;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }
}
