'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CoolMode } from "./ui/cool-mode";
import Particles from "./ui/particles";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { login } from "@/lib/services/api";
import { cn } from "@/lib/utils";


import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { BorderBeam } from "./ui/border-beam";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { setUser } from "../../store/slices/userSlice";
import { useTheme } from 'next-themes';



export default function Login() {

    const router = useRouter();
    const { toast } = useToast();
    const [showContent, setShowContent] = useState(false);
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.user.user);
    const { theme } = useTheme();

    useEffect(() => {
        if (user) {
            router.push("/home");
        } else {
            setShowContent(true);
        }
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        const username = event.target.username.value;
        const password = event.target.password.value;
    
        try {
            const result = await login(username, password);
            dispatch(setUser(result));
            toast({
                title: "Login Successful",
                description: result.message
            });
            router.push("/home");
        } catch (error) {
            console.error('Login error:', error);
            toast({
                title: "Login Error",
                description: error.message
            });
        }
    };

    if (!showContent) {
        return null;
    }


    return (
        <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">

            <Particles
                className="absolute inset-0"
                quantity={300}
                ease={80}
                color={theme === "dark" ? "#ffffff" : "#000000"}
                refresh={true}
            />


            <Card className="w-4/5 lg:w-3/5 h-3/5 relative flex flex-col justify-between shadow-[0_0_30px_5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_5px_rgba(255,255,255,0.1)] overflow-hidden"> {/* using custom shadows for a more soft spread out */}
                <div className="flex w-full justify-center pt-4">
                    <Image
                        src="/images/surge-logo.jpeg"
                        alt="SurgeLogo"
                        width={100}
                        height={100}
                        priority
                    />
                </div>

                <CardHeader>
                    <CardTitle>Surge Connect Login</CardTitle>
                    <CardDescription>Enter Your credentials</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="loginForm" onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-4">
                            <div>
                                <label htmlFor="username">Username</label>
                                <Input id="username" placeholder="username" required />
                            </div>
                            <div>
                                <label htmlFor="password">Password</label>
                                <Input id="password" type="password" placeholder="password" required />
                            </div>
                        </div>
                    </form>

                </CardContent>
                <CardFooter className="relative flex justify-between">
                    <Link href={'/register'}>Register now</Link>
                    <CoolMode>
                        <Button type="submit" form="loginForm">submit</Button>
                    </CoolMode>

                </CardFooter>
                <BorderBeam />
            </Card>

        </div>

    );
}