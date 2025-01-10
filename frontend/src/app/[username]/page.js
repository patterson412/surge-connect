"use client";
import { useParams } from 'next/navigation';

export default function Profile() {
    const params = useParams();
    const username = params.username;
    console.log(username);
    return null;
}