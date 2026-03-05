import { useState, useRef, useEffect } from 'react';

const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 menit
const STORAGE_KEY = 'lazy_last_active';

/**
 * Cek apakah user baru login / idle lama.
 * Jika aktif dalam 5 menit terakhir → skip animasi.
 */
function shouldAnimate() {
    try {
        const last = sessionStorage.getItem(STORAGE_KEY);
        if (!last) return true; // pertama kali (fresh session / baru login)
        return Date.now() - parseInt(last, 10) > IDLE_THRESHOLD;
    } catch {
        return true;
    }
}

function markActive() {
    try {
        sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
        // ignore
    }
}

/**
 * LazyFileCard — wraps each file/folder card with:
 * 1. Intersection Observer to animate in on scroll (fade + slide up)
 * 2. Skeleton shimmer while not yet visible
 *
 * Animasi hanya muncul saat:
 * - Fresh session (baru login)
 * - Idle lebih dari 5 menit
 *
 * Navigasi biasa antar folder → langsung tampil tanpa animasi.
 */
export default function LazyFileCard({ children, index = 0, className = "" }) {
    const ref = useRef(null);
    const [animate] = useState(() => shouldAnimate());
    const [isVisible, setIsVisible] = useState(!animate);

    useEffect(() => {
        // Tandai user aktif setiap kali komponen ini di-mount
        markActive();
    }, []);

    useEffect(() => {
        if (!animate) return; // skip observer, langsung tampil

        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(el);
                }
            },
            { rootMargin: '50px', threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [animate]);

    // Tanpa animasi: render langsung
    if (!animate) {
        return (
            <div className={`relative hover:z-50 focus-within:z-50 ${className}`}>
                {children}
            </div>
        );
    }

    // Dengan animasi: shimmer → fade in
    return (
        <div
            ref={ref}
            className={`transition-all duration-500 ease-out relative hover:z-50 focus-within:z-50 ${className}`}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: isVisible ? `${Math.min(index * 50, 300)}ms` : '0ms',
            }}
        >
            {isVisible ? children : (
                <div className="animate-pulse bg-gray-100 rounded-2xl h-52 w-full" />
            )}
        </div>
    );
}
