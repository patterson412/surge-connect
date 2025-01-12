'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createPost } from "@/lib/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from "../lib/hooks"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { X, ImagePlus } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";


const PostNew = ({ open, onOpenChange, fetchPosts }) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { toast } = useToast();

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [caption, setCaption] = useState("");
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const removeImage = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 8 * 1024 * 1024) { // 8MB limit
                toast({
                    title: "File too large",
                    description: "Please select an image under 8MB",
                    variant: "destructive"
                });
                return;
            }
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleCaptionChange = (e) => {
        const value = e.target.value;
        console.log('Caption value:', value);
        setCaption(value);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedFile || !caption?.trim()) {
            console.log('image or caption is empty, returning');
            return;
        }

        const formData = new FormData();

        formData.append('file', selectedFile);
        formData.append('caption', caption);

        setIsPosting(true);
        try {
            const response = await createPost(formData);
            setCaption("");
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setSelectedFile(null);
            setPreviewUrl(null);
            setIsPosting(false);
            fetchPosts();
            onOpenChange(false);
            toast({
                title: "Created Post",
                description: "Successfully posted new post"
            });
        } catch (error) {
            setIsPosting(false);
            console.error("Failed to post:", error.message);
            toast({
                title: "Failed to create post",
                description: error.response?.data?.message || error.message || "An error occurred"
            });
        }

    }

    return (

        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm md:max-w-[900px] p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-center">Create New Post</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col md:flex-row w-full">
                    {/* Image Upload Section */}
                    <div className="flex items-center justify-center w-full md:w-3/5 bg-white">
                        <div className="relative w-full aspect-square bg-slate-100">
                            {previewUrl ? (
                                <>
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:opacity-90 transition-opacity"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                    <ImagePlus className="w-12 h-12 text-gray-400" />
                                    <span className="mt-2 text-sm text-gray-500">Upload an image</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Caption Section */}
                    <div className="w-full md:w-2/5 p-4 flex flex-col">
                        <Textarea
                            placeholder="Write a caption..."
                            className="flex-grow min-h-40 resize-none border-0 focus-visible:ring-0 whitespace-pre-line"
                            value={caption}
                            onChange={handleCaptionChange}
                        />

                        <div className="mt-4">
                            <Button
                                className="w-full"
                                onClick={handleSubmit}
                                disabled={!selectedFile || !caption.trim() || isPosting}
                            >
                                {isPosting ? "Posting..." : "Share"}
                            </Button>
                        </div>
                    </div>
                </div>

            </DialogContent>
        </Dialog>


    );
}

export default PostNew;