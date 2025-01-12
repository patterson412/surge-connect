"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PostCard from "./PostCard";
import PostNew from "./PostNew";
import { getAllPosts, logout } from "@/lib/services/api";
import { Skeleton } from "./ui/skeleton";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearUser, setLoading, setUser } from "../../store/slices/userSlice";
import { getUser } from "@/lib/services/api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, PlusSquare } from "lucide-react";
import { Separator } from "./ui/separator";

export default function HomeStructure() {
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const loading = useAppSelector((state) => state.user.loading);
    const user = useAppSelector((state) => state.user.user);
    const { toast } = useToast();

    const validateUser = async () => {
        try {
            dispatch(setLoading(true));
            const response = await getUser();
            dispatch(setUser(response));
            await fetchPosts();
        } catch (error) {
            console.log(error.response?.data?.message || error.message || "Authentication error");
            toast({
                title: "Not Authorized",
                description: error.response?.data?.message || error.message || "Authentication error"
            });
            dispatch(clearUser());
            router.push("/login");
        }
    }

    useEffect(() => {
        validateUser();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoadingPosts(true);
            const feed = await getAllPosts();
            setPosts(feed);
        } catch (error) {
            console.log(error.response?.data?.message || error.message || "An error occurred");
            toast({
                title: "Unable to get Feed",
                description: error.response?.data?.message || error.message || "An error occurred"
            });
        } finally {
            setLoadingPosts(false);
        }
    }

    const handleLogout = async () => {
        dispatch(clearUser());
        try {
            await logout();
        } catch (error) {
            console.error("Error during logout:", error);
        } finally {
            router.push("/login");
        }
    };

    if (loading) {
        return null;
    }

    if (loadingPosts) {
        return (
            <div className="flex flex-col h-screen w-screen items-center justify-center gap-3">
                <div className="flex flex-col space-y-3">
                    <Skeleton className="h-96 w-96 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-4 w-52" />
                    </div>
                </div>
                <div className="flex flex-col space-y-3">
                    <Skeleton className="h-96 w-96 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-4 w-52" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen flex flex-col relative">
            {/* Mobile top header menu */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 flex flex-col">
                        <SheetTitle className="text-center">Profile</SheetTitle>
                        <div className="flex flex-col items-center space-y-4 mt-8">
                            <div className="relative w-20 h-20">
                                <Image
                                    src={user?.profilePic || "/images/placeholderpost.png"}
                                    alt="Profile Picture"
                                    fill
                                    className="rounded-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-gray-600">{user?.fullName}</span>
                                <Link href={`/${user?.username}`} className="font-semibold hover:underline">
                                    {user?.username}
                                </Link>
                            </div>
                        </div>
                        <div className="flex justify-center items-end flex-1 w-full">
                            <Button variant="destructive" className="w-full" onClick={handleLogout}>Logout</Button>
                        </div>
                    </SheetContent>
                </Sheet>

                <div className="flex justify-center items-center">
                    <Image
                        src="/images/surge-logo.jpeg"
                        alt="SurgeLogo"
                        width={80}
                        height={80}
                        priority
                        className="object-contain"
                    />
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCreatePost(true)}
                >
                    <PlusSquare className="h-6 w-6" />
                </Button>
            </div>

            {/* Desktop layout */}
            <div className="hidden lg:block h-full">
                <div className="fixed left-1/2 -translate-x-[32rem] top-8">
                    <Image
                        src="/images/surge-logo.jpeg"
                        alt="SurgeLogo"
                        width={100}
                        height={100}
                        priority
                    />
                </div>
                <div className="max-w-[470px] mx-auto overflow-y-auto">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <PostCard
                                key={post.id}
                                postId={post.id}
                                username={post.username}
                                likeCount={post.likeCount}
                                img={post.img}
                                commentCount={post.commentCount}
                                isLiked={post.isLiked}
                                isSaved={post.isSaved}
                                caption={post.caption}
                                date={post.date}
                            />
                        ))
                    ) : (
                        <div className="w-full flex justify-center items-center">
                            <span className="italic">{"NO POSTS YET :("}</span>
                        </div>
                    )}
                </div>
                <div className="fixed right-1/2 translate-x-[32rem] top-8">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative w-20 h-20">
                            <img
                                src={user?.profilePic || "/images/placeholderpost.png"}
                                alt="Profile Picture"
                                className="rounded-full object-cover w-full h-full"
                            />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-gray-600">{user?.fullName}</span>
                            <Link href={`/${user?.username}`} className="font-semibold hover:underline">
                                {user?.username}
                            </Link>
                        </div>
                        <div className="flex flex-col w-full gap-2">
                            <Button
                                onClick={() => setShowCreatePost(true)}
                                className="w-full flex items-center gap-2"
                            >
                                <PlusSquare className="h-5 w-5" />
                                Create Post
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleLogout}
                                className="w-full"
                            >
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Content */}
            <div className="lg:hidden flex-1 overflow-y-auto scrollbar-hide self-center">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <PostCard
                            key={post.id}
                            postId={post.id}
                            username={post.username}
                            likeCount={post.likeCount}
                            img={post.img}
                            commentCount={post.commentCount}
                            isLiked={post.isLiked}
                            isSaved={post.isSaved}
                            caption={post.caption}
                            date={post.date}
                        />
                    ))
                ) : (
                    <div className="w-full flex justify-center items-center">
                        <span className="italic">{"NO POSTS YET :("}</span>
                    </div>
                )}
            </div>

            {/* Create Post Dialog */}
            <PostNew
                open={showCreatePost}
                onOpenChange={setShowCreatePost}
                fetchPosts={fetchPosts}
            />

        </div>
    );
}