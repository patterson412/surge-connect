package com.surge.backend;

import com.surge.backend.dao.*;
import com.surge.backend.dto.CommentNewDto;
import com.surge.backend.dto.PostNewDto;
import com.surge.backend.entity.*;
import com.surge.backend.service.*;
import com.surge.backend.util.TimeFormatter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BackendApplicationTests {

	@Mock
	private PostDao postDao;

	@Mock
	private SaveDao saveDao;

	@Mock
	private LikeDao likeDao;

	@Mock
	private CommentDao commentDao;

	@Mock
	private MemberService memberService;

	@Mock
	private S3Service s3Service;

	@Mock
	private TimeFormatter timeFormatter;

	@Mock
	private SecurityContext securityContext;

	@Mock
	private Authentication authentication;

	@InjectMocks
	private PostService postService;

	private UserDetails userDetails;
	private Member testUser;
	private Post testPost;

	@BeforeEach
	void setUp() {
		// Setup test user
		testUser = new Member();
		testUser.setUserId("testUser");
		testUser.setEmail("test@test.com");
		testUser.setFirstName("Test");
		testUser.setLastName("User");

		// Setup test post
		testPost = new Post();
		testPost.setId(1L);
		testPost.setCaption("Test Caption");
		testPost.setFile("test-file-url");
		testPost.setUser(testUser);

		// Setup security context
		userDetails = User.withUsername("testUser")
				.password("password")
				.roles("USER")
				.build();
		when(authentication.getPrincipal()).thenReturn(userDetails);
		when(securityContext.getAuthentication()).thenReturn(authentication);
		SecurityContextHolder.setContext(securityContext);

		// Base mock that's used by all tests
		when(memberService.getUser("testUser")).thenReturn(testUser);
	}

	@Test
	void testAddPost() {
		// Arrange
		when(postDao.save(any(Post.class))).thenReturn(testPost);

		PostNewDto dto = new PostNewDto();
		dto.setCaption("Test Post");
		dto.setFile(new MockMultipartFile(
				"file",
				"test.jpg",
				"image/jpeg",
				"test image content".getBytes()
		));

		// Act
		Post result = postService.addPost(dto);

		// Assert
		assertNotNull(result);
		assertEquals("Test Caption", result.getCaption());
		assertEquals("test-file-url", result.getFile());
		assertEquals("testUser", result.getUser().getUserId());

		verify(memberService).getUser("testUser");
		verify(s3Service).uploadFile(any(), eq(S3Service.ImageType.PROFILE_POSTS), eq("testUser"));
		verify(postDao).save(any(Post.class));
	}

	@Test
	void testUpdateCaption() {
		// Arrange
		Post updatedPost = new Post();
		updatedPost.setId(1L);
		updatedPost.setCaption("Updated Caption");
		updatedPost.setUser(testUser);

		when(postDao.findById(1L)).thenReturn(Optional.of(testPost));
		when(postDao.save(any(Post.class))).thenReturn(updatedPost);

		// Act
		Post result = postService.updateCaption(1L, "Updated Caption");

		// Assert
		assertNotNull(result);
		assertEquals("Updated Caption", result.getCaption());
		verify(postDao).save(any(Post.class));
	}

	@Test
	void testUpdateCaption_UnauthorizedUser() {
		// Arrange
		Member otherUser = new Member();
		otherUser.setUserId("otherUser");

		Post otherUserPost = new Post();
		otherUserPost.setId(1L);
		otherUserPost.setUser(otherUser);

		when(postDao.findById(1L)).thenReturn(Optional.of(otherUserPost));

		// Act & Assert
		assertThrows(IllegalArgumentException.class,
				() -> postService.updateCaption(1L, "Updated Caption")
		);
	}

	@Test
	void testDeletePost() {
		// Arrange
		doNothing().when(s3Service).deleteFile(any());
		when(postDao.findById(1L)).thenReturn(Optional.of(testPost));

		// Act
		assertDoesNotThrow(() -> postService.deletePost(1L));

		// Assert
		verify(postDao).delete(testPost);
		verify(s3Service).deleteFile(testPost.getFile());
	}

	@Test
	void testDeletePost_PostNotFound() {
		// Arrange
		when(postDao.findById(anyLong())).thenReturn(Optional.empty());

		// Act & Assert
		assertThrows(NoSuchElementException.class,
				() -> postService.deletePost(1L)
		);
		verify(postDao, never()).delete(any());
		verify(s3Service, never()).deleteFile(any());
	}

	@Test
	void testToggleLike_AddLike() {
		// Arrange
		when(postDao.findById(1L)).thenReturn(Optional.of(testPost));
		when(likeDao.existsByPost_IdAndUser_UserId(1L, "testUser")).thenReturn(false);
		when(likeDao.getTotalLikesForPost(1L)).thenReturn(1);

		// Act
		Map<String, Object> result = postService.toggleLike(1L);

		// Assert
		assertTrue((Boolean) result.get("isNowLiked"));
		assertEquals(1, result.get("likeCount"));
		verify(likeDao).save(any(Like.class));
	}

	@Test
	void testToggleLike_RemoveLike() {
		// Arrange
		when(postDao.findById(1L)).thenReturn(Optional.of(testPost));
		when(likeDao.existsByPost_IdAndUser_UserId(1L, "testUser")).thenReturn(true);
		when(likeDao.getTotalLikesForPost(1L)).thenReturn(0);

		// Act
		Map<String, Object> result = postService.toggleLike(1L);

		// Assert
		assertFalse((Boolean) result.get("isNowLiked"));
		assertEquals(0, result.get("likeCount"));
		verify(likeDao).deleteByPost_IdAndUser_UserId(1L, "testUser");
	}

	@Test
	void testToggleSave_AddSave() {
		// Arrange
		when(postDao.findById(1L)).thenReturn(Optional.of(testPost));
		when(saveDao.existsByPost_IdAndUser_UserId(1L, "testUser")).thenReturn(false);

		// Act
		boolean result = postService.toggleSave(1L);

		// Assert
		assertTrue(result);
		verify(saveDao).save(any(Save.class));
	}

	@Test
	void testToggleSave_RemoveSave() {
		// Arrange
		when(postDao.findById(1L)).thenReturn(Optional.of(testPost));
		when(saveDao.existsByPost_IdAndUser_UserId(1L, "testUser")).thenReturn(true);

		// Act
		boolean result = postService.toggleSave(1L);

		// Assert
		assertFalse(result);
		verify(saveDao).deleteByPost_IdAndUser_UserId(1L, "testUser");
	}

	@Test
	void testAddComment() {
		// Arrange
		Comment newComment = new Comment();
		newComment.setContent("Test Comment");
		newComment.setUser(testUser);
		newComment.setPost(testPost);

		when(postDao.findById(1L)).thenReturn(Optional.of(testPost));
		when(commentDao.save(any(Comment.class))).thenReturn(newComment);

		CommentNewDto dto = new CommentNewDto();
		dto.setComment("Test Comment");

		// Act
		Comment result = postService.addComment(dto, 1L);

		// Assert
		assertNotNull(result);
		assertEquals("Test Comment", result.getContent());
		assertEquals(testUser, result.getUser());
		assertEquals(testPost, result.getPost());
		verify(commentDao).save(any(Comment.class));
	}

	@Test
	void testAddComment_WithReply() {
		// Arrange
		Comment parentComment = new Comment();
		parentComment.setId(1L);
		parentComment.setContent("Parent Comment");
		parentComment.setUser(testUser);
		parentComment.setPost(testPost);

		Comment replyComment = new Comment();
		replyComment.setContent("Reply Comment");
		replyComment.setUser(testUser);
		replyComment.setPost(testPost);
		replyComment.setParent(parentComment);

		when(postDao.findById(1L)).thenReturn(Optional.of(testPost));
		when(commentDao.findById(1L)).thenReturn(Optional.of(parentComment));
		when(commentDao.save(any(Comment.class))).thenReturn(replyComment);

		CommentNewDto dto = new CommentNewDto();
		dto.setComment("Reply Comment");
		dto.setReplyTo(1L);

		// Act
		Comment result = postService.addComment(dto, 1L);

		// Assert
		assertNotNull(result);
		assertEquals("Reply Comment", result.getContent());
		assertEquals(parentComment, result.getParent());
		verify(commentDao).save(any(Comment.class));
	}

	@Test
	void testGetAllCommentsForPost() {
		// Arrange
		List<Comment> comments = new ArrayList<>();
		Comment comment1 = new Comment();
		comment1.setId(1L);
		comment1.setContent("Comment 1");
		comments.add(comment1);

		when(postDao.findById(1L)).thenReturn(Optional.of(testPost));
		when(commentDao.findAllByPost_IdAndParentIsNullOrderByCreatedAtDesc(1L)).thenReturn(comments);
		when(commentDao.getTotalCommentsForPost(1L)).thenReturn(1);

		// Act
		Map<String, Object> result = postService.getAllCommentsForPost(1L);

		// Assert
		assertNotNull(result);
		assertEquals(1, result.get("commentCount"));
		List<?> resultComments = (List<?>) result.get("comments");
		assertFalse(resultComments.isEmpty());
	}

	@Test
	void testGetAllPosts() {
		// Arrange
		List<Post> posts = Collections.singletonList(testPost);
		when(postDao.findAllOrderByLikesAndCreatedAt()).thenReturn(posts);
		when(likeDao.getTotalLikesForPost(anyLong())).thenReturn(5);
		when(commentDao.getTotalCommentsForPost(anyLong())).thenReturn(3);
		when(timeFormatter.toRelativeTime(any())).thenReturn("1 hour ago");

		// Act
		List<Map<String, Object>> result = postService.getAllPosts();

		// Assert
		assertFalse(result.isEmpty());
		Map<String, Object> firstPost = result.getFirst();
		assertEquals(testPost.getId(), firstPost.get("id"));
		assertEquals(testPost.getCaption(), firstPost.get("caption"));
		assertEquals(5, firstPost.get("likeCount"));
		assertEquals(3, firstPost.get("commentCount"));
	}
}