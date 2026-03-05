import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 2 : 0) + ' ' + units[i];
};

const categoryConfig = {
    Images: {
        color: 'from-blue-500 to-cyan-400', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-100', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        )
    },
    Videos: {
        color: 'from-purple-500 to-pink-400', bgColor: 'bg-purple-50', textColor: 'text-purple-600', borderColor: 'border-purple-100', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        )
    },
    Audio: {
        color: 'from-green-500 to-emerald-400', bgColor: 'bg-green-50', textColor: 'text-green-600', borderColor: 'border-green-100', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
        )
    },
    Documents: {
        color: 'from-orange-500 to-amber-400', bgColor: 'bg-orange-50', textColor: 'text-orange-600', borderColor: 'border-orange-100', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        )
    },
    Archives: {
        color: 'from-yellow-500 to-orange-400', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600', borderColor: 'border-yellow-100', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
        )
    },
    Other: {
        color: 'from-gray-500 to-slate-400', bgColor: 'bg-gray-50', textColor: 'text-gray-600', borderColor: 'border-gray-100', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        )
    },
};

export default function StorageDetails({ className = '' }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewFile, setPreviewFile] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = () => {
        axios.get(route('storage.summary'))
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleSelect = (fileId) => {
        setSelectedFiles(prev =>
            prev.includes(fileId)
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    const toggleSelectAll = () => {
        if (!data?.largest_files) return;
        if (selectedFiles.length === data.largest_files.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(data.largest_files.map(f => f.id));
        }
    };

    const handleDelete = (fileId) => {
        if (!confirm('Move this file to trash?')) return;
        setDeleting(true);
        router.delete(route('files.destroy', fileId), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedFiles(prev => prev.filter(id => id !== fileId));
                fetchData();
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    };

    const handleBulkDelete = () => {
        if (selectedFiles.length === 0) return;
        if (!confirm(`Move ${selectedFiles.length} file(s) to trash?`)) return;
        setDeleting(true);

        let completed = 0;
        selectedFiles.forEach(fileId => {
            router.delete(route('files.destroy', fileId), {
                preserveScroll: true,
                onSuccess: () => {
                    completed++;
                    if (completed === selectedFiles.length) {
                        setSelectedFiles([]);
                        fetchData();
                        setDeleting(false);
                    }
                },
                onError: () => {
                    completed++;
                    if (completed === selectedFiles.length) {
                        setSelectedFiles([]);
                        fetchData();
                        setDeleting(false);
                    }
                },
            });
        });
    };

    if (loading) {
        return (
            <section className={className}>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded-xl w-48"></div>
                    <div className="h-32 bg-gray-200 rounded-2xl"></div>
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>)}
                    </div>
                </div>
            </section>
        );
    }

    if (!data) return null;

    const { total_size, total_files, categories, largest_files } = data;

    return (
        <section className={className}>
            <header className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    Storage Overview
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Detailed breakdown of your storage usage across all file types.
                </p>
            </header>

            {/* Total Storage Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 shadow-xl shadow-indigo-200/40 mb-6">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/4"></div>
                </div>
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 text-xs font-black uppercase tracking-widest">Total Storage Used</p>
                        <p className="text-4xl font-black text-white mt-1">{formatSize(total_size)}</p>
                        <p className="text-indigo-200 text-sm font-medium mt-1">
                            {total_files} {total_files === 1 ? 'file' : 'files'} stored
                        </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                    </div>
                </div>

                {/* Visual bar */}
                {categories.length > 0 && (
                    <div className="mt-5 flex rounded-full overflow-hidden h-2.5 bg-white/20">
                        {categories.map((cat, i) => {
                            const config = categoryConfig[cat.category] || categoryConfig.Other;
                            const pct = total_size > 0 ? (cat.total_size / total_size) * 100 : 0;
                            return (
                                <div
                                    key={i}
                                    className={`bg-gradient-to-r ${config.color} transition-all duration-700`}
                                    style={{ width: `${Math.max(pct, 1)}%` }}
                                    title={`${cat.category}: ${formatSize(cat.total_size)}`}
                                ></div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {categories.map((cat, i) => {
                    const config = categoryConfig[cat.category] || categoryConfig.Other;
                    const pct = total_size > 0 ? ((cat.total_size / total_size) * 100).toFixed(1) : 0;
                    return (
                        <div key={i} className={`${config.bgColor} ${config.borderColor} border rounded-2xl p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`${config.textColor}`}>
                                    {config.icon}
                                </div>
                                <span className="text-xs font-black uppercase tracking-wider text-gray-500">{cat.category}</span>
                            </div>
                            <p className={`text-xl font-black ${config.textColor}`}>{formatSize(cat.total_size)}</p>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[11px] text-gray-400 font-medium">{cat.file_count} {cat.file_count === 1 ? 'file' : 'files'}</span>
                                <span className={`text-[11px] font-bold ${config.textColor}`}>{pct}%</span>
                            </div>
                            <div className="mt-2 h-1.5 bg-white/80 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all duration-700`}
                                    style={{ width: `${Math.max(pct, 2)}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}

                {categories.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="font-bold text-sm">No files uploaded yet</p>
                        <p className="text-xs mt-1">Start uploading files to see your storage breakdown</p>
                    </div>
                )}
            </div>

            {/* Largest Files */}
            {largest_files && largest_files.length > 0 && (
                <div>
                    {/* Header with actions */}
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Largest Files
                        </h3>

                        <div className="flex items-center gap-2">
                            {/* Select All */}
                            <button
                                onClick={toggleSelectAll}
                                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all hover:bg-indigo-50 text-gray-500 hover:text-indigo-600"
                            >
                                {selectedFiles.length === largest_files.length ? 'Deselect All' : 'Select All'}
                            </button>

                            {/* Bulk Delete */}
                            {selectedFiles.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={deleting}
                                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all disabled:opacity-50"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {deleting ? 'Deleting...' : `Trash (${selectedFiles.length})`}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {largest_files.map((file, i) => {
                            const pct = total_size > 0 ? ((file.size / total_size) * 100).toFixed(1) : 0;
                            const isSelected = selectedFiles.includes(file.id);
                            return (
                                <div
                                    key={file.id}
                                    className={`flex items-center gap-3 rounded-xl p-3 border transition-all group ${isSelected
                                            ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20'
                                            : 'bg-gray-50 hover:bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                        }`}
                                >
                                    {/* Checkbox */}
                                    <div className="flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(file.id)}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </div>

                                    {/* Rank */}
                                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                        <span className="text-[11px] font-black text-gray-500">#{i + 1}</span>
                                    </div>

                                    {/* File info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-700 truncate group-hover:text-indigo-600 transition-colors">{file.original_name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-400 font-medium">{file.mime_type}</span>
                                            {file.folder && (
                                                <>
                                                    <span className="text-gray-300">·</span>
                                                    <span className="text-[10px] text-indigo-400 font-medium">📁 {file.folder.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Size */}
                                    <div className="flex-shrink-0 text-right mr-1">
                                        <p className="text-sm font-black text-gray-800">{formatSize(file.size)}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{pct}%</p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Preview */}
                                        <button
                                            onClick={() => setPreviewFile(file)}
                                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                                            title="Preview"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>

                                        {/* Download */}
                                        <a
                                            href={route('files.download', file.id)}
                                            className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                                            title="Download"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </a>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            disabled={deleting}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                            title="Move to Trash"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setPreviewFile(null)}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

                    {/* Modal Content */}
                    <div
                        className="relative bg-gray-900 rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-[95vw] max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-5 flex justify-between items-center text-white bg-black/40 backdrop-blur-md border-b border-white/5">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Previewing</span>
                                <h3 className="font-black text-lg truncate max-w-md">{previewFile.original_name}</h3>
                                <span className="text-xs text-gray-400 font-medium">{formatSize(previewFile.size)} · {previewFile.mime_type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={route('files.download', previewFile.id)}
                                    className="bg-white/10 p-2.5 rounded-xl hover:bg-white/20 transition-all text-white"
                                    title="Download"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </a>
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="bg-white/10 p-2.5 rounded-xl hover:bg-white/20 transition-all text-white"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-gray-900 to-black overflow-auto">
                            {previewFile.mime_type?.startsWith('image/') ? (
                                <img
                                    src={route('preview.show', previewFile.id)}
                                    alt={previewFile.original_name}
                                    className="max-w-full max-h-[70vh] object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg"
                                />
                            ) : previewFile.mime_type === 'application/pdf' ? (
                                <iframe
                                    src={route('preview.show', previewFile.id)}
                                    className="w-full h-[70vh] bg-white rounded-xl shadow-2xl"
                                />
                            ) : previewFile.mime_type?.startsWith('video/') ? (
                                <video controls className="max-w-full max-h-[70vh] shadow-2xl rounded-xl outline-none" autoPlay>
                                    <source src={route('preview.show', previewFile.id)} type={previewFile.mime_type} />
                                </video>
                            ) : previewFile.mime_type?.startsWith('audio/') ? (
                                <div className="text-center p-12">
                                    <div className="bg-white/5 p-8 rounded-full inline-block mb-6">
                                        <svg className="w-20 h-20 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                        </svg>
                                    </div>
                                    <audio controls className="w-full max-w-md" autoPlay>
                                        <source src={route('preview.show', previewFile.id)} type={previewFile.mime_type} />
                                    </audio>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 p-16 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                                    <div className="bg-white/5 p-6 rounded-full inline-block mb-4">
                                        <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-xl font-black text-gray-200">No Preview Available</p>
                                    <p className="text-gray-500 mt-2 text-sm">This file type cannot be displayed in browser</p>
                                    <a
                                        href={route('files.download', previewFile.id)}
                                        className="mt-6 inline-flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg text-sm"
                                    >
                                        Download File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
