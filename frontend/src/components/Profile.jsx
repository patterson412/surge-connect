"use client";
import { useAppSelector } from "@/lib/hooks";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import Image from "next/image";
import { getSavedPosts } from "@/lib/services/api";
import { updateCaption } from "@/lib/services/api";
import { deletePost } from "@/lib/services/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Profile = ({ posts, fetchUserPosts, profileUsername, profileData }) => {
    const router = useRouter();
    const { toast } = useToast();
    const user = useAppSelector((state) => state.user.user);
    const [clickedPost, setClickedPost] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [caption, setCaption] = useState("");
    const [savedPosts, setSavedPosts] = useState([]);
    const [isShowingSaved, setIsShowingSaved] = useState(false);
    const [isLoadingSaved, setIsLoadingSaved] = useState(false);

    const isCurrentUserProfile = user?.username === profileUsername;

    const fetchSavedPosts = async () => {
        try {
            setIsLoadingSaved(true);
            const response = await getSavedPosts();
            setSavedPosts(response);
        } catch (error) {
            console.error("Could not fetch saved posts", error);
            toast({
                title: "Error",
                description: "Could not load saved posts"
            });
        } finally {
            setIsLoadingSaved(false);
        }
    };

    const handleToggleSaved = async () => {
        if (!isCurrentUserProfile) {
            toast({
                title: "Access Denied",
                description: "You can only view saved posts on your own profile",
                variant: "destructive"
            });
            return;
        }

        if (!isShowingSaved && savedPosts.length === 0) {
            await fetchSavedPosts();
        }
        setIsShowingSaved(!isShowingSaved);
    };

    const handleCaptionChange = (e) => {
        const value = e.target.value;
        console.log('Caption value:', value);
        setCaption(value);
    }

    const handleUpdateCaption = async (e) => {
        e.preventDefault();

        if (clickedPost.caption.trim() === caption.trim() || !caption.trim() || !clickedPost) {
            return
        }

        try {
            setIsUpdating(true);
            const response = await updateCaption(clickedPost.id, caption);
            setCaption("");
            setClickedPost(null);
            fetchUserPosts?.();
            toast({
                title: "Updated caption",
                description: "Successfully updated post caption"
            });
        } catch (error) {
            console.error("Could not update caption", error);
            toast({
                title: "Could not update caption",
                description: error.response?.data?.message || error.message || "An error occurred"
            });
        } finally {
            setIsUpdating(false);
        }
    }

    const handleDeletePost = async () => {
        if (!clickedPost) return;

        try {
            setIsDeleting(true);
            await deletePost(clickedPost.id);
            setClickedPost(null);
            fetchUserPosts?.();
            toast({
                title: "Deleted post",
                description: "Successfully deleted the post"
            });
        } catch (error) {
            console.error("Could not delete post", error);
            toast({
                title: "Could not delete post",
                description: error.response?.data?.message || error.message || "An error occurred"
            });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="w-full min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => router.push('/home')}
                    className="absolute left-4 top-4 md:left-8 md:top-8 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Back to home"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>

                {/* Profile Header Section */}
                <div className="flex flex-col md:flex-row items-center md:items-center md:justify-center gap-8 mb-12">
                    {/* Profile Picture */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                        <img
                            src={profileData?.profilePic || "/images/placeholderpost.png"}
                            alt="Profile Picture"
                            className="w-full h-full rounded-full object-cover border-2 border-gray-200"
                        />
                    </div>

                    {/* Profile Info */}
                    <div className="flex flex-col items-center">
                        <h1 className="text-xl md:text-2xl font-semibold mb-2">
                            {profileData?.username || "Username"}
                        </h1>
                        <h2 className="text-lg text-gray-600 mb-4">
                            {profileData?.fullName || "Full Name"}
                        </h2>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="flex justify-center gap-8 mb-8 border-y border-gray-200 py-4">
                    <button
                        onClick={() => setIsShowingSaved(false)}
                        className={`text-center transition-colors ${!isShowingSaved ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className="font-semibold">{posts?.length || 0}</span>
                        <p className="text-gray-600">posts</p>
                    </button>

                    <button
                        onClick={handleToggleSaved}
                        className={`text-center transition-colors flex flex-col items-center gap-1 ${isShowingSaved ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        disabled={!isCurrentUserProfile}
                    >
                        <span className="font-semibold">{savedPosts?.length || "view"}</span>
                        <p className="text-gray-600">saved</p>
                        {!isCurrentUserProfile && <Lock className="h-4 w-4" />}
                    </button>
                </div>

                {/* Posts Grid */}
                {isLoadingSaved ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading saved posts...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-1">
                        {(isShowingSaved ? savedPosts : posts)?.map((post, index) => (
                            <div key={post.id || index} className="relative aspect-square" onClick={() => {
                                if (!isShowingSaved) {
                                    setCaption(post.caption);
                                    setClickedPost(post);
                                }
                            }}>
                                <div className="absolute inset-0">
                                    <Image
                                        src={post.img || "/images/placeholderpost.png"}
                                        alt={`Post ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                                        <div className="flex gap-4 text-white">
                                            <span className="flex items-center">
                                                <span className="mr-1">❤️</span>
                                                {post.likeCount || 0}
                                            </span>
                                            <span className="flex items-center">
                                                <span className="mr-1">💬</span>
                                                {post.commentCount || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoadingSaved && ((isShowingSaved ? savedPosts : posts)?.length === 0) && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">
                            {isShowingSaved ? "No saved posts" : "No posts yet"}
                        </p>
                    </div>
                )}
            </div>

            <Dialog open={clickedPost ? true : false} onOpenChange={() => setClickedPost(null)}>
                <DialogContent className="max-w-sm md:max-w-[900px] p-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle className="text-center">My Post</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col md:flex-row w-full">
                        <div className="flex items-center justify-center w-full md:w-3/5 bg-white">
                            <div className="relative w-full aspect-square bg-slate-100">
                                <Image
                                    src={clickedPost?.img || "/images/placeholderpost.png"}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-2/5 p-4 flex flex-col">
                            <Textarea
                                placeholder="Write a caption..."
                                className="flex-grow min-h-40 resize-none border-0 focus-visible:ring-0 whitespace-pre-line"
                                value={caption}
                                onChange={handleCaptionChange}
                                disabled={!isCurrentUserProfile || clickedPost?.username !== user?.username}
                            />

                            <div className="mt-4 space-y-2">
                                <Button
                                    className="w-full"
                                    onClick={handleUpdateCaption}
                                    disabled={!isCurrentUserProfile || clickedPost?.username !== user?.username || clickedPost?.caption?.trim() === caption?.trim() || !caption?.trim() || isUpdating}
                                >
                                    {isUpdating ? "Updating..." : "Update Caption"}
                                </Button>

                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={handleDeletePost}
                                    disabled={!isCurrentUserProfile || clickedPost?.username !== user?.username || isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Delete Post"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Profile;