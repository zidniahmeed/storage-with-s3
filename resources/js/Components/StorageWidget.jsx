import { Link } from '@inertiajs/react';

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 2 : 0) + ' ' + units[i];
};

export default function StorageWidget({ storageUsed = 0, totalFiles = 0 }) {
    return (
        <Link
            href={route('profile.edit')}
            className="group flex items-center gap-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 hover:from-indigo-100 hover:via-purple-100 hover:to-pink-100 border border-indigo-100/60 rounded-2xl px-4 py-2.5 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-100/50 hover:-translate-y-0.5 cursor-pointer"
        >
            {/* Storage Icon */}
            <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/60 group-hover:shadow-indigo-300/80 transition-shadow">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                </div>
                {/* Pulse dot */}
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border border-white"></span>
                </span>
            </div>

            {/* Info */}
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none">Storage</span>
                <span className="text-sm font-black text-gray-800 leading-tight mt-0.5 group-hover:text-indigo-700 transition-colors">
                    {formatSize(storageUsed)}
                </span>
                <span className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">
                    {totalFiles} {totalFiles === 1 ? 'file' : 'files'}
                </span>
            </div>

            {/* Arrow */}
            <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-0.5 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
        </Link>
    );
}
