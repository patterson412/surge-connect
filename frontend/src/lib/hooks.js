import { useDispatch, useSelector, useStore } from 'react-redux'
import { useEffect, useState } from "react"

export const useAppDispatch = useDispatch
export const useAppSelector = useSelector
export const useAppStore = useStore

export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const media = window.matchMedia(query);
        const listener = (event) => setMatches(event.matches);
        media.addEventListener("change", listener);
        setMatches(media.matches);
        return () => media.removeEventListener("change", listener);
    }, [query])

    return matches
}