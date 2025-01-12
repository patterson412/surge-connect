package com.surge.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class S3Service {
    private final S3Client s3Client;
    private final String bucketName;
    private final String region;

    private final S3Presigner s3Presigner;

    public S3Service(S3Client s3Client,
                     S3Presigner s3Presigner,
                     @Value("${aws.s3.bucket}") String bucketName,
                     @Value("${aws.s3.region}") String region) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.region = region;
        this.s3Presigner = s3Presigner;
    }


    // For organizing objects in folders in S3
    public enum ImageType {
        PROFILE_PHOTO("profile-photos"),    // Will become: username/profile-photos/image.jpg
        PROFILE_POSTS("profile-posts");     // Will become: username/profile-posts/image.jpg

        private final String folder;

        ImageType(String folder) {
            this.folder = folder;
        }

        public String getFolder() {
            return folder;
        }
    }


    public String uploadFile(MultipartFile file, ImageType imageType, String username) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be null or empty");
        }
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username must not be null or empty");
        }

        // Image validation
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }

        try {
            // Generate filename with username as the root folder
            String fileName = username + "/" +
                    imageType.getFolder() + "/" +
                    generateUniqueFileName(file.getOriginalFilename());

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromInputStream(file.getInputStream(),
                            file.getSize()));

            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "presignedUrls",
            key = "#objectKey",
            unless = "#result == null")
    public String generatePreSignedUrl(String objectKey) {

        GetObjectRequest objectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(10))  // The URL will expire in 10 minutes.
                .getObjectRequest(objectRequest)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);

        return presignedRequest.url().toExternalForm();

    }

    public void deleteFile(String key) {
        if (key == null || key.trim().isEmpty()) {
            throw new IllegalArgumentException("File key cannot be null or empty");
        }

        try {

            // Check if file exists before deleting, as this returns object metadata without downloading the object
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            try {
                s3Client.headObject(headObjectRequest);
            } catch (NoSuchKeyException e) {
                throw new RuntimeException("File does not exist in S3");
            }

            // Delete the file
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to delete file from S3: " + e.getMessage(), e);
        }
    }

    public void deleteMultipleFiles(List<String> fileKeys) {
        if (fileKeys == null || fileKeys.isEmpty()) {
            throw new IllegalArgumentException("File URLs list cannot be null or empty");
        }

        List<ObjectIdentifier> keys = new ArrayList<>();
        List<String> failedKeys = new ArrayList<>();

        for (String key : fileKeys) {
            try {
                keys.add(ObjectIdentifier.builder().key(key).build());
            } catch (Exception e) {
                failedKeys.add(key);
            }
        }

        if (!failedKeys.isEmpty()) {
            throw new IllegalArgumentException("Invalid URLs: " + String.join(", ", failedKeys));
        }

        try {
            DeleteObjectsRequest deleteRequest = DeleteObjectsRequest.builder()
                    .bucket(bucketName)
                    .delete(Delete.builder().objects(keys).build())
                    .build();

            DeleteObjectsResponse response = s3Client.deleteObjects(deleteRequest);

            // Check for any failed deletions
            if (!response.errors().isEmpty()) {
                List<String> errorMessages = response.errors().stream()
                        .map(error -> error.key() + ": " + error.message())
                        .toList();
                throw new RuntimeException("Failed to delete some files: " + String.join(", ", errorMessages));
            }
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to delete files from S3: " + e.getMessage(), e);
        }
    }

    public void cleanupBucketFolders() {
        try {
            // List all image type folders we want to clean
            List<String> foldersToClean = new ArrayList<>();
            for (ImageType imageType : ImageType.values()) {
                foldersToClean.add(imageType.getFolder());
            }

            // List all objects in the bucket
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .build();

            ListObjectsV2Response listResponse;
            do {
                listResponse = s3Client.listObjectsV2(listRequest);

                if (!listResponse.contents().isEmpty()) {
                    // Prepare batch delete request
                    List<ObjectIdentifier> objectsToDelete = new ArrayList<>();

                    // Only delete objects that are in our designated folders
                    for (S3Object s3Object : listResponse.contents()) {
                        String key = s3Object.key();
                        // Check if the object is in any of our image folders
                        for (String folder : foldersToClean) {
                            if (key.contains("/" + folder + "/")) {
                                objectsToDelete.add(ObjectIdentifier.builder()
                                        .key(key)
                                        .build());
                                break;
                            }
                        }
                    }

                    if (!objectsToDelete.isEmpty()) {
                        // Delete the batch of objects
                        DeleteObjectsRequest deleteRequest = DeleteObjectsRequest.builder()
                                .bucket(bucketName)
                                .delete(Delete.builder()
                                        .objects(objectsToDelete)
                                        .quiet(false)
                                        .build())
                                .build();

                        DeleteObjectsResponse deleteResponse = s3Client.deleteObjects(deleteRequest);

                        // Check for errors
                        if (!deleteResponse.errors().isEmpty()) {
                            List<String> errorMessages = deleteResponse.errors().stream()
                                    .map(error -> error.key() + ": " + error.message())
                                    .toList();
                            System.err.println("Failed to delete some objects: "
                                    + String.join(", ", errorMessages));
                        } else {
                            System.out.println("Successfully deleted " + objectsToDelete.size()
                                    + " objects");
                        }
                    }
                }

                // Update the list request with the continuation token
                listRequest = ListObjectsV2Request.builder()
                        .bucket(bucketName)
                        .continuationToken(listResponse.nextContinuationToken())
                        .build();

            } while (listResponse.isTruncated());

            System.out.println("Bucket cleanup completed successfully");

        } catch (S3Exception e) {
            throw new RuntimeException("Failed to cleanup S3 bucket folders: " + e.getMessage(), e);
        }
    }

    private String generateUniqueFileName(String originalFilename) {
        if (originalFilename == null) {
            return System.currentTimeMillis() + "_file";
        }
        return System.currentTimeMillis() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_");
        /*
        Replaces any character that is NOT (that's what ^ means):

        a-z: lowercase letters
        A-Z: uppercase letters
        0-9: numbers
        .: period
        -: hyphen

        Replaces these special characters with underscore _
         */
    }
}
