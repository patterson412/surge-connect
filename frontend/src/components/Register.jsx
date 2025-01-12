'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import Link from "next/link";
import { useTheme } from 'next-themes';

import { CoolMode } from "./ui/cool-mode";
import Particles from "./ui/particles";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { BorderBeam } from "./ui/border-beam";
import { useToast } from "@/hooks/use-toast";
import { register } from "@/lib/services/api";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";
import {italic} from "next/dist/lib/picocolors";

export default function Register() {
    const router = useRouter();
    const { toast } = useToast();
    const [showContent, setShowContent] = useState(false);
    const user = useAppSelector((state) => state.user.user);
    const { theme } = useTheme();

    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            router.push("/home");
        } else {
            setShowContent(true);
        }
    }, [user, router]);

    // Cleanup object URL when component unmounts or preview changes
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    title: "File too large",
                    description: "Please select an image under 5MB",
                    variant: "destructive"
                });
                return;
            }
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const removeImage = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('username', event.target.username.value);
        formData.append('password', event.target.password.value);
        formData.append('email', event.target.email.value);
        formData.append('firstName', event.target.firstName.value);
        formData.append('lastName', event.target.lastName.value);
        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        try {
            const result = await register(formData);
            toast({
                title: "Registration Successful",
                description: result.message || 'Registration complete!',
            });
            router.push("/login");
        } catch (error) {
            console.error('Registration error:', error);
            toast({
                title: "Registration Error",
                description: error.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordChange = (event) => {
        if (event.target.value.trim() !== password) {
            setError(true);
        } else {
            setError(false);
        }
    };

    if (!showContent) {
        return null;
    }

    if (isSubmitting) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p>Registering User...</p>
                <p className="italic">Thank you for your patience, finishing up and routing to login page...</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden p-4">
            <Particles
                className="absolute inset-0"
                quantity={300}
                ease={80}
                color={theme === "dark" ? "#ffffff" : "#000000"}
                refresh={true}
            />

            <Card className="w-4/5 lg:w-3/5 max-h-[90vh] relative flex flex-col shadow-[0_0_30px_5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_5px_rgba(255,255,255,0.1)]">
                <div className="flex w-full justify-center pt-4">
                    <Image
                        src="/images/surge-logo.jpeg"
                        alt="SurgeLogo"
                        width={100}
                        height={100}
                        priority
                    />
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <CardHeader>
                        <CardTitle>Surge Connect Register</CardTitle>
                        <CardDescription>Enter Your credentials</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form id="registerForm" onSubmit={handleSubmit}>
                            <div className="grid w-full items-center gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" placeholder="First Name" required />
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" placeholder="Last Name" required />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="Email" required />
                                </div>
                                <div>
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" placeholder="Username" required />
                                </div>
                                <div>
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Password"
                                        required
                                        onChange={(event) => setPassword(event.target.value.trim())}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm password"
                                        required
                                        onChange={handlePasswordChange}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="profilePic">Profile Picture (Optional)</Label>
                                    <div className="space-y-4">
                                        <Input
                                            id="profilePic"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="cursor-pointer"
                                        />
                                        {previewUrl && (
                                            <div className="relative w-24 h-24 mx-auto">
                                                <div className="relative w-24 h-24 rounded-full overflow-hidden">
                                                    <Image
                                                        src={previewUrl}
                                                        alt="Profile preview"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="text-sm text-muted-foreground">
                                            Recommended: Square image, max 8MB
                                        </div>
                                    </div>
                                </div>
                                <span className={cn("text-red-500", {
                                    "hidden": !error
                                })}>Passwords do not match!</span>
                            </div>
                        </form>
                    </CardContent>
                </div>

                <CardFooter className="relative flex justify-between pt-4 border-t">
                    <Link href={'/login'}>Login</Link>
                    <CoolMode>
                        <Button
                            type="submit"
                            form="registerForm"
                            disabled={error}
                            className={cn({
                                "opacity-50 cursor-not-allowed": error
                            })}
                        >
                            Submit
                        </Button>
                    </CoolMode>
                </CardFooter>
                <BorderBeam />
            </Card>
        </div>
    );
}