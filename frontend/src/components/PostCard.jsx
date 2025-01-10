'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toggleLike, toggleSave, } from "@/lib/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "../lib/hooks"
import { clearUser } from "../../store/slices/userSlice";

export default function PostCard({ postId, username = "undefined", likeCount = 0, img, commentCount = 0, isLiked = false, isSaved = false, caption, date }) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const [saved, setSaved] = useState(isSaved);
    const [liked, setLiked] = useState(isLiked);
    const [isCommentOpen, setIsCommentOpen] = useState(false);

    const [updatedLikeCount, setUpdatedLikeCount] = useState(likeCount);
    const [updatedCommentCount, setUpdatedCommentCount] = useState(commentCount);

    const handleLike = async () => {
        try {
            const likedObject = await toggleLike(postId);
            setLiked(likedObject.isNowLiked);
            setUpdatedLikeCount(likedObject.likeCount);
        } catch (error) {
            console.log(error.response?.data?.message || error.message || "An error occurred");
            toast({
                title: "Unable to like post",
                description: error.response?.data?.message || error.message || "An error occurred"
            });
        }

    }

    const handleSave = async () => {
        try {
            const savedObject = await toggleSave(postId);
            setSaved(savedObject.isNowSaved);
        } catch (error) {
            console.log(error.response?.data?.message || error.message || "An error occurred");
            toast({
                title: "Unable to save post",
                description: error.response?.data?.message || error.message || "An error occurred"
            });

        }
    }

    return (
        <div id="PostContainer" className="w-post bg-white flex flex-col">
            <div id="ImageContainer" className="aspect-square w-full">
                <img
                    src={img || "/images/placeholderpost.png"}
                    alt="PostImage"
                    className="h-full w-full object-cover"
                />
            </div>
            <div id="EngagementContainer" className="w-full flex justify-between items-center p-3 border border-gray-200">
                <div id="LikeAndComment" className="flex gap-4">
                    <div id="LikesContainer" className="flex items-center gap-2" onClick={handleLike}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-heart cursor-pointer", liked ? "fill-red-500 stroke-red-500" : "fill-none stroke-current hover:text-red-500")}>
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                        <span className="text-sm">{updatedLikeCount}</span>
                    </div>
                    <div id="CommentContainer" className="flex items-center gap-2" onClick={() => setIsCommentOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle cursor-pointer hover:opacity-60">
                            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                        </svg>
                        <span className="text-sm">{updatedCommentCount}</span>
                    </div>
                </div>

                <Link href={`/${username}`} className="font-medium text-sm hover:opacity-50">
                    <span>{username}</span>
                </Link>

                <svg onClick={handleSave} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-bookmark cursor-pointer hover:opacity-50", saved ? "fill-current stroke-current" : "fill-none stroke-current")}>
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                </svg>
            </div>

            <div id="Caption" className="w-post h-auto">
                <span className="font-sans text-lg">{caption}</span>
            </div>

            <CommentDialog
                open={isCommentOpen}
                onOpenChange={setIsCommentOpen}
                postId={postId}
                commentCount={updatedCommentCount}
                onCommentAdded={setUpdatedCommentCount}
            />
        </div>
    );
}