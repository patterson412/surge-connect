"use client";
import { getAllPostsForUser } from '@/lib/services/api';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useCallback } from 'react';
import Profile from '@/components/Profile';
import { getUserProfile } from '@/lib/services/api';

export default function ProfilePage() {
    const { toast } = useToast();
    const { username } = useParams();
    console.log(username);

    const [posts, setPosts] = useState([]);
    const [profileData, setProfileData] = useState(null);

    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [isLoadingProfileData, setIsLoadingProfileData] = useState(false);

    const fetchUserPosts = useCallback(async () => {
        try {
            setIsLoadingPosts(true);
            const response = await getAllPostsForUser(username);
            setPosts(response);
        } catch (error) {
            console.error("Error fetching posts for user", error);
            toast({
                title: "Unable to fetch user posts",
                description: error.response?.data?.message || error.message || "An error occurred"
            });
        } finally {
            setIsLoadingPosts(false);
        }
    }, []);

    const fetchUserProfile = useCallback(async () => {
        try {
            setIsLoadingProfileData(true);
            const response = await getUserProfile(username);
            setProfileData(response);
        } catch (error) {
            console.error("Error fetching user profile", error);
            toast({
                title: "Unable to fetch user profile",
                description: error.response?.data?.message || error.message
            });
        } finally {
            setIsLoadingProfileData(false);
        }
    });

    useEffect(() => {
        fetchUserProfile();
        fetchUserPosts();
    }, [username]);

    if (isLoadingPosts || isLoadingProfileData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <Profile 
            posts={posts} 
            fetchUserPosts={fetchUserPosts} 
            profileUsername={username}
            profileData={profileData}
        />
    );
}