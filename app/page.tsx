'use client';
import { useEffect, useState } from 'react';

import Viewer from '@/src/components/Viewer';

import '@/app/globals.css';

export default function Page() {
    const [blocking, setBlocking] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (!hasMounted || !window.IDEE || !blocking) return;

        const handleInit = () => {
            setBlocking(false);
        };

        handleInit();
    }, [blocking, hasMounted]);

    if (!hasMounted) return null;


    return (
        <>
        {!blocking && (
            <Viewer />
        )

        }
        </>
    );
}