import { useState, useCallback } from 'react';

/**
 * FileThumb — renders an image thumbnail with:
 * 1. Loading shimmer animation while the image loads
 * 2. Smooth fade-in when loaded
 * 3. Error state with a retry button if it fails to load
 */
export default function FileThumb({ file, viewMode = 'grid' }) {
    const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'
    const [retryKey, setRetryKey] = useState(0);

    const sizeClass = viewMode === 'grid' ? 'w-24 h-24' : 'w-10 h-10';
    const shimmerSize = viewMode === 'grid' ? 'w-16 h-16' : 'w-8 h-8';

    const handleRetry = useCallback((e) => {
        e.stopPropagation();
        setStatus('loading');
        setRetryKey(prev => prev + 1);
    }, []);

    if (!file.mime_type?.startsWith('image/')) {
        // Non-image: show file icon
        return (
            <svg className={`${viewMode === 'grid' ? 'w-20 h-20' : 'w-10 h-10'} text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
        );
    }

    return (
        <div className={`${sizeClass} relative group/img`}>
            {/* Loading shimmer */}
            {status === 'loading' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded-xl" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className={`${shimmerSize} text-gray-300 animate-pulse`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Fallback icon behind image */}
            <div className="absolute inset-0 flex items-center justify-center z-0">
                <svg className={`${shimmerSize} text-gray-200`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
            </div>

            {/* Error state with retry */}
            {status === 'error' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-red-50 border border-red-100">
                    <svg className={`${viewMode === 'grid' ? 'w-8 h-8' : 'w-5 h-5'} text-red-300 mb-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <button
                        onClick={handleRetry}
                        className={`flex items-center gap-1 bg-white text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-all active:scale-95 ${viewMode === 'grid' ? 'px-2.5 py-1 text-[10px]' : 'px-1.5 py-0.5 text-[9px]'} font-bold shadow-sm`}
                    >
                        <svg className={`${viewMode === 'grid' ? 'w-3 h-3' : 'w-2.5 h-2.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                    </button>
                </div>
            )}

            {/* Actual image */}
            {status !== 'error' && (
                <img
                    key={retryKey}
                    src={route('preview.show', file.id)}
                    alt=""
                    loading="lazy"
                    className={`relative z-10 w-full h-full object-cover rounded-xl shadow-sm border border-gray-100 transition-all duration-500 group-hover/img:scale-105 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setStatus('loaded')}
                    onError={() => setStatus('error')}
                />
            )}
        </div>
    );
}
