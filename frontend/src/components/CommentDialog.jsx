'use client';
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "./ui/drawer";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useMediaQuery } from "@/lib/hooks";
import { useToast } from '@/hooks/use-toast';
import { addComment, getComments } from '@/lib/services/api';

const Comment = ({ comment, depth = 0, onReply }) => (
    <div className={`space-y-2 mb-4 ${depth > 0 ? 'ml-8' : ''}`}>
        <p className="text-sm text-gray-500">{comment.text}</p>
        <div className="flex items-center gap-4">
            <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-gray-400 hover:text-gray-600"
            >
                Reply
            </button>
            {comment.replies?.length > 0 && (
                <span className="text-xs text-gray-400">
                    {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
            )}
        </div>
        {comment.replies?.map((reply) => (
            <Comment
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                onReply={onReply}
            />
        ))}
    </div>
);

const CommentsContent = ({
    comments,
    commentText,
    onCommentChange,
    replyTo,
    setReplyTo,
    handleSubmitComment,
    isSubmitting
}) => (
    <div className="flex flex-col max-h-[470px] max-w-[470px]">
        <div className="flex-1 p-4 overflow-scroll scrollbar-hide">
            {comments.length > 0 ? (
                comments.map((commentItem) => (
                    <Comment
                        comment={commentItem}
                        key={commentItem.id}
                        onReply={setReplyTo}
                    />
                ))
            ) : (
                <p className="text-sm text-gray-500">No comments yet</p>
            )}
        </div>
        <div className="p-4 border-t">
            <div className="flex flex-col gap-2">
                {replyTo && (
                    <div className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded">
                        <span className="text-xs text-gray-500">Replying to comment</span>
                        <button
                            onClick={() => setReplyTo(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                )}
                <div className="flex gap-2">
                    <Textarea
                        value={commentText}
                        onChange={onCommentChange}
                        placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                        className="flex-1 resize-none focus-within:ring-0 focus:ring-0"
                        rows={1}
                    />
                    <Button
                        onClick={handleSubmitComment}
                        disabled={!commentText?.trim() || isSubmitting}
                        className="self-end"
                    >
                        {replyTo ? 'Reply' : 'Post'}
                    </Button>
                </div>
            </div>
        </div>
    </div>
);

const CommentDialog = ({
    open,
    onOpenChange,
    postId,
    commentCount = 0,
    onCommentAdded
}) => {
    const { toast } = useToast();
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [comments, setComments] = useState([]);
    const [replyTo, setReplyTo] = useState(null);

    const fetchComments = async () => {
        try {
            const commentsObjectList = await getComments(postId);
            setComments(commentsObjectList.comments);
            onCommentAdded(commentsObjectList.commentCount);
        } catch (error) {
            console.log(error.response?.data?.message || error.message || "An error occurred");
            toast({
                title: "Unable to fetch comments",
                description: error.response?.data?.message || error.message || "An error occurred"
            });
        }
    };

    const handleCommentChange = (e) => {
        const value = e.target.value;
        console.log('Comment value:', value);
        setCommentText(value);
    };

    useEffect(() => {
        if (open) {
            fetchComments();
        }
    }, [open]);

    const handleSubmitComment = async () => {
        console.log('Submitting comment:', commentText); 
        if (!commentText?.trim()) {
            console.log('Comment is empty, returning');
            return;
        }

        setIsSubmitting(true);
        try {
            await addComment(postId, commentText, replyTo);
            setCommentText(""); // Reset the comment text
            setReplyTo(null);
            await fetchComments();
        } catch (error) {
            console.error("Failed to post comment:", error.message);
            toast({
                title: "Failed to add comment",
                description: error.response?.data?.message || error.message || "An error occurred"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Comments ({commentCount})</DialogTitle>
                    </DialogHeader>
                    <CommentsContent
                        comments={comments}
                        commentText={commentText}
                        onCommentChange={handleCommentChange}
                        replyTo={replyTo}
                        setReplyTo={setReplyTo}
                        handleSubmitComment={handleSubmitComment}
                        isSubmitting={isSubmitting}
                    />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader className="border-b">
                    <DrawerTitle>Comments ({commentCount})</DrawerTitle>
                </DrawerHeader>
                <CommentsContent
                    comments={comments}
                    commentText={commentText}
                    onCommentChange={handleCommentChange}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    handleSubmitComment={handleSubmitComment}
                    isSubmitting={isSubmitting}
                />
            </DrawerContent>
        </Drawer>
    );
};

export default CommentDialog;