import { useRouter } from "next/router";

export default function profile() {
    const router = useRouter();
    const username = router.query.username;
    return null;
}