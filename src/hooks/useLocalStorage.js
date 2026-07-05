import { useEffect, useState } from "react";

export default function useLocalStorage(key, defaultValue) {
    const [value, setValue] = useState(() => {
        try {
            const stored = localStorage.getItem(key);

            if (stored !== null) {
                return JSON.parse(stored);
            }

            return defaultValue;
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(
                key,
                JSON.stringify(value)
            );
        } catch {
            // Ignore storage errors for now.
        }
    }, [key, value]);

    return [value, setValue];
}