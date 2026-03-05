import { useState, useRef, useEffect } from 'react';

/**
 * LazyFileCard — wraps each file/folder card with:
 * 1. Intersection Observer to animate in on scroll (fade + slide up)
 * 2. Skeleton shimmer while not yet visible
 */
export default function LazyFileCard({ children, index = 0 }) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
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
    }, []);

    return (
        <div
            ref={ref}
            className="transition-all duration-500 ease-out"
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
