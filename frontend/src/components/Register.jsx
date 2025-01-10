'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CoolMode } from "./ui/cool-mode";
import Particles from "./ui/particles";


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
import { register } from "@/lib/services/api";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";


export default function Register() {

    const router = useRouter();
    const { toast } = useToast();
    const [showContent, setShowContent] = useState(false);
    const user = useAppSelector((state) => state.user.user);

    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);

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
            const result = await register(username, password);
            console.log(result.message);
            toast({
                title: "Registration Successfull",
                description: result.message || 'An error occurred',
            });
            router.push("/login");
        } catch (error) {
            console.error('Registration error:', error);
            toast({
                title: "Registration Error",
                description: error.message
            });
        }

    }

    const handleChange = (event) => {
        if (event.target.value.trim() !== password) {
            setError(true);
        } else {
            setError(false);
        }
    }

    if (!showContent) {

        return null;
    }


    return (
        <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">

            <Particles
                className="absolute inset-0"
                quantity={300}
                ease={80}
                color={color}
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
                    <CardTitle>Surge Connect Register</CardTitle>
                    <CardDescription>Enter Your credentials</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="registerForm" onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-4">
                            <div>
                                <label htmlFor="username">Username</label>
                                <Input id="username" placeholder="username" required />
                            </div>
                            <div>
                                <label htmlFor="password">Password</label>
                                <Input id="password" placeholder="password" required onChange={(event) => setPassword(event.target.value.trim())} />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <Input id="confirmPassword" placeholder="confirm password" required onChange={handleChange} />
                            </div>
                            <span className={cn("text-red-500", {
                                "hidden": !error
                            })}>Passwords do no match!</span>
                        </div>
                    </form>

                </CardContent>
                <CardFooter className="relative flex justify-between">
                    <Link href={'/login'}>Login</Link>
                    <CoolMode>
                        <Button type="submit" form="registerForm" disabled={error} className={cn({
                            "opacity-50 cursor-not-allowed": error
                        })}>submit</Button>
                    </CoolMode>

                </CardFooter>
                <BorderBeam />
            </Card>

        </div>

    );
}