import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Trash({ folders, files }) {
    const [viewMode, setViewMode] = useState('list');
    const [loading, setLoading] = useState(true);
    const [offcanvasItem, setOffcanvasItem] = useState(null);
    const { delete: destroy, processing } = useForm();

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const restoreFolder = (id) => {
        router.post(route('trash.folders.restore', id), {}, {
            onSuccess: () => setOffcanvasItem(null)
        });
    };

    const restoreFile = (id) => {
        router.post(route('trash.files.restore', id), {}, {
            onSuccess: () => setOffcanvasItem(null)
        });
    };

    const deleteFolder = (id) => {
        if (confirm('Permanently delete this folder? This cannot be undone.')) {
            destroy(route('trash.folders.destroy', id), {
                onSuccess: () => setOffcanvasItem(null)
            });
        }
    };

    const deleteFile = (id) => {
        if (confirm('Permanently delete this file?')) {
            destroy(route('trash.files.destroy', id), {
                onSuccess: () => setOffcanvasItem(null)
            });
        }
    };

    const emptyTrash = () => {
        if (confirm('Are you sure you want to empty the trash? All items will be permanently deleted.')) {
            destroy(route('trash.empty'));
        }
    };

    const SkeletonRow = () => (
        <div className="flex items-center space-x-4 py-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/6"></div>
            </div>
            <div className="hidden md:block w-24 h-4 bg-gray-100 rounded"></div>
            <div className="w-20 h-8 bg-gray-100 rounded-lg"></div>
        </div>
    );

    const SkeletonCard = () => (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center animate-pulse">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col lg:flex-row lg:justify-between justify-center items-center">
                    <h2 className="text-xl font-black leading-tight text-gray-800 mb-4 lg:mb-0">
                        Trash Bin
                    </h2>

                    <div className="flex items-center space-x-3">
                        {(folders.length > 0 || files.length > 0) && (
                            <button
                                onClick={emptyTrash}
                                className="flex items-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-red-100 shadow-sm"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                Empty Trash
                            </button>
                        )}
                        <div className="h-6 w-px bg-gray-200 mx-2 hidden lg:block"></div>
                        <div className="bg-gray-100/50 p-1 rounded-xl flex space-x-1 border border-gray-200">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5h7L14 8h6a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Trash" />

            <div className="py-12 min-h-screen">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

                    <div className="bg-white/70 backdrop-blur-sm shadow-xl sm:rounded-3xl p-8 border border-white/40">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Recently Deleted</h3>
                                <p className="text-gray-500 text-sm font-medium mt-1">Items in trash will be permanently deleted after 30 days</p>
                            </div>
                            <Link href={route('dashboard')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl transition-all">Back to Files</Link>
                        </div>

                        {loading ? (
                            <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6" : "space-y-4"}>
                                {[1, 2, 3, 4, 5, 6].map(i => viewMode === 'grid' ? <SkeletonCard key={i} /> : <SkeletonRow key={i} />)}
                            </div>
                        ) : folders.length === 0 && files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                <div className="bg-white p-6 rounded-full shadow-inner mb-4">
                                    <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </div>
                                <h4 className="text-xl font-bold text-gray-400">Trash is empty</h4>
                                <p className="text-gray-400 text-sm mt-1">No deleted items found</p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" : "overflow-hidden"}>
                                {viewMode === 'list' && (
                                    <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 mb-2">
                                        <div className="col-span-6 text-[10px] uppercase font-black text-gray-400 tracking-widest">Name & Details</div>
                                        <div className="col-span-3 text-[10px] uppercase font-black text-gray-400 tracking-widest">Deleted Date</div>
                                        <div className="col-span-3 text-right text-[10px] uppercase font-black text-gray-400 tracking-widest">Actions</div>
                                    </div>
                                )}

                                {folders.map((f) => (
                                    viewMode === 'grid' ? (
                                        <div key={f.id} className="group relative bg-white border border-gray-100 rounded-3xl p-6 flex flex-col items-center text-center hover:shadow-2xl hover:border-indigo-100 transition-all">
                                            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <svg className="w-12 h-12 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                                </svg>
                                            </div>
                                            <h4 className="text-sm font-black text-gray-800 truncate w-full px-2 mb-1">{f.name}</h4>
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Folder</span>

                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setOffcanvasItem({ ...f, type: 'folder' })} className="p-2 bg-white shadow-lg rounded-full text-gray-400 hover:text-indigo-600">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={f.id} className="group grid grid-cols-12 lg:gap-4 items-center bg-white lg:hover:bg-indigo-50/30 px-4 lg:px-6 py-4 rounded-2xl transition-all border-b lg:border-none border-gray-50">
                                            <div className="col-span-11 lg:col-span-6 flex items-center min-w-0">
                                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                                    <svg className="w-6 h-6 lg:w-7 lg:h-7 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm lg:text-base font-black text-gray-800 truncate pr-4">{f.name}</h4>
                                                    <div className="flex items-center mt-0.5 space-x-2">
                                                        <span className="lg:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(f.deleted_at).toLocaleDateString()}</span>
                                                        <span className="lg:hidden w-1 h-1 bg-gray-200 rounded-full"></span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Folder</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="hidden lg:block lg:col-span-3 text-sm font-bold text-gray-500">
                                                {new Date(f.deleted_at).toLocaleDateString()}
                                            </div>

                                            <div className="col-span-1 lg:col-span-3 text-right">
                                                {/* Mobile Action Trigger */}
                                                <button
                                                    onClick={() => setOffcanvasItem({ ...f, type: 'folder' })}
                                                    className="lg:hidden p-2 text-gray-300 hover:text-indigo-600 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12l-6-6h12l-6 6z" /></svg>
                                                </button>

                                                {/* Desktop Actions */}
                                                <div className="hidden lg:flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => restoreFolder(f.id)} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-black uppercase hover:bg-green-100 transition shadow-sm">Restore</button>
                                                    <button onClick={() => deleteFolder(f.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-black uppercase hover:bg-red-100 transition shadow-sm">Delete</button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}

                                {files.map((file) => (
                                    viewMode === 'grid' ? (
                                        <div key={file.id} className="group relative bg-white border border-gray-100 rounded-3xl p-6 flex flex-col items-center text-center hover:shadow-2xl hover:border-indigo-100 transition-all">
                                            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                {file.mime_type?.startsWith('image/') ? (
                                                    <img src={route('preview.show', file.id)} className="w-full h-full object-cover rounded-xl" alt="" />
                                                ) : (
                                                    <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <h4 className="text-sm font-black text-gray-800 truncate w-full px-2 mb-1">{file.original_name}</h4>
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</span>

                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setOffcanvasItem({ ...file, type: 'file' })} className="p-2 bg-white shadow-lg rounded-full text-gray-400 hover:text-indigo-600">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={file.id} className="group grid grid-cols-12 lg:gap-4 items-center bg-white lg:hover:bg-indigo-50/30 px-4 lg:px-6 py-4 rounded-2xl transition-all border-b lg:border-none border-gray-50">
                                            <div className="col-span-11 lg:col-span-6 flex items-center min-w-0">
                                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                                    {file.mime_type?.startsWith('image/') ? (
                                                        <img src={route('preview.show', file.id)} className="w-full h-full object-cover rounded-lg" alt="" />
                                                    ) : (
                                                        <svg className="w-6 h-6 lg:w-7 lg:h-7 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm lg:text-base font-black text-gray-800 truncate pr-4">{file.original_name}</h4>
                                                    <div className="flex items-center mt-0.5 space-x-2">
                                                        <span className="lg:hidden text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(file.deleted_at).toLocaleDateString()}</span>
                                                        <span className="lg:hidden w-1 h-1 bg-gray-200 rounded-full"></span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="hidden lg:block lg:col-span-3 text-sm font-bold text-gray-500">
                                                {new Date(file.deleted_at).toLocaleDateString()}
                                            </div>

                                            <div className="col-span-1 lg:col-span-3 text-right">
                                                {/* Mobile Action Trigger */}
                                                <button
                                                    onClick={() => setOffcanvasItem({ ...file, type: 'file' })}
                                                    className="lg:hidden p-2 text-gray-300 hover:text-indigo-600 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12l-6-6h12l-6 6z" /></svg>
                                                </button>

                                                {/* Desktop Actions */}
                                                <div className="hidden lg:flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => restoreFile(file.id)} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-black uppercase hover:bg-green-100 transition shadow-sm">Restore</button>
                                                    <button onClick={() => deleteFile(file.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-black uppercase hover:bg-red-100 transition shadow-sm">Delete</button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Actions Modal (Offcanvas Style) */}
            <Modal show={!!offcanvasItem} onClose={() => setOffcanvasItem(null)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className={`p-3 rounded-2xl ${offcanvasItem?.type === 'folder' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                            {offcanvasItem?.type === 'folder' ? (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Trash Item Actions</span>
                            <h3 className="text-lg font-black text-gray-900 truncate">{offcanvasItem?.name || offcanvasItem?.original_name}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <SecondaryButton
                            className="flex-1 justify-center py-4 rounded-2xl border-green-100 bg-green-50 text-green-600 hover:bg-green-100"
                            onClick={() => offcanvasItem?.type === 'folder' ? restoreFolder(offcanvasItem.id) : restoreFile(offcanvasItem.id)}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Restore
                        </SecondaryButton>
                        <DangerButton
                            className="flex-1 justify-center py-4 rounded-2xl"
                            onClick={() => offcanvasItem?.type === 'folder' ? deleteFolder(offcanvasItem.id) : deleteFile(offcanvasItem.id)}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                        </DangerButton>
                    </div>

                    <button
                        onClick={() => setOffcanvasItem(null)}
                        className="w-full mt-4 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition"
                    >
                        Dismiss
                    </button>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
