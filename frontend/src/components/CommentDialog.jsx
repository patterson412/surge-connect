'use client';
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "./ui/drawer";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useMediaQuery } from "@/lib/hooks";
import { useToast } from '@/hooks/use-toast';
import { addComment, getComments } from '@/lib/services/api';
import { useAppDispatch } from "../lib/hooks"
import { clearUser } from '../../store/slices/userSlice';
import { useRouter } from "next/navigation";

const CommentDialog = ({
    open,
    onOpenChange,
    postId,
    commentCount = 0,
    onCommentAdded
}) => {
    const { toast } = useToast();
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const [comments, setComments] = useState([]);
    const [replyTo, setReplyTo] = useState(null);

    const router = useRouter();
    const dispatch = useAppDispatch();

    const fetchComments = async () => {
        try {
            const commentsObjectList = await getComments(postId);
            setComments(commentsObjectList);
        } catch (error) {
            console.log(error.response?.data?.message || error.message || "An error occurred");
            toast({
                title: "Unable to fetch comments",
                description: error.response?.data?.message || error.message || "An error occurred"
            });
        }
    }

    useEffect(() => {
        if (open) {
            fetchComments();
        }
    }, [open]);

    useEffect(() => {
        onCommentAdded(comments.length);
    }, [comments]);


    const handleSubmitComment = async () => {
        if (!comment.trim()) return;

        setIsSubmitting(true);
        try {
            await addComment(postId, comment, replyTo);
            setComment("");
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

    // Keeping all replies at same indentation level (ml-8), if needed can increase nesting indendation with each level of depth, but for better UI/UX it is kept like this
    const Comment = ({ comment, depth = 0 }) => (
        <div className={`space-y-2 mb-4 ${depth > 0 ? 'ml-8' : ''}`}>
            <p className="text-sm text-gray-500">{comment.text}</p>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setReplyTo(comment.id)}
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
                />
            ))}
        </div>
    );

    const CommentsContent = () => (
        <>
            <div className="flex flex-col h-full">
                <div className="flex-1 p-4 overflow-y-auto">
                    {comments.length > 0 ? (
                        comments.map((comment) => (
                            <Comment comment={comment} key={comment.id} />
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
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                                className="flex-1 resize-none"
                                rows={1}
                            />
                            <Button
                                onClick={handleSubmitComment}
                                disabled={!comment.trim() || isSubmitting}
                                className="self-end"
                            >
                                {replyTo ? 'Reply' : 'Post'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Comments ({commentCount})</DialogTitle>
                    </DialogHeader>
                    <CommentsContent />
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
                <CommentsContent />
            </DrawerContent>
        </Drawer>
    );
};

export default CommentDialog;