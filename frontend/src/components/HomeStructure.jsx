'use client';
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PostCard from "./PostCard";
import { getAllPosts } from "@/lib/services/api";
import { Skeleton } from "./ui/skeleton";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearUser, setLoading, setUser } from "../../store/slices/userSlice";
import { getUser } from "@/lib/services/api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function HomeStructure() {

    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
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
        fetchPosts();
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

    if (loading || loadingPosts) {
        return (
            <div className="flex flex-col space-y-3">
                <Skeleton className="h-[125px] w-[250px] rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        )
    }

    return (
        <div className="w-screen h-screen grid grid-cols-3">
            <div className="p-4 self-start">
                <Image
                    src="/images/surge-logo.jpeg"
                    alt="SurgeLogo"
                    width={100}
                    height={100}
                    priority
                />
            </div>
            <div className="overflow-y-auto">
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
                    <span>COULD NOT FETCH POSTS</span>
                )}
            </div>
            <div className="p-4 flex flex-col space-y-4 self-start">
                <div className="relative w-16 h-16">
                    <Image
                        src={user?.profilePic || "/images/default-avatar.png"}
                        alt="Profile Picture"
                        fill
                        className="rounded-full object-cover"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-gray-600">{user?.fullName}</span>
                    <Link href={`/${user?.username}`} className="font-semibold hover:underline">{user?.username}</Link>
                </div>
            </div>
        </div>
    );
}