import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import Breadcrumbs from '@/Components/Breadcrumbs';
import FileUpload from '@/Components/FileUpload';
import Dropdown from '@/Components/Dropdown';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import StorageWidget from '@/Components/StorageWidget';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';

export default function Dashboard({ folder, folders, files, breadcrumbs, allFolders, storageUsed, totalFiles }) {
    const [viewMode, setViewMode] = useState('grid');
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [shareUrl, setShareUrl] = useState('');
    const [zipStatus, setZipStatus] = useState(folder?.zip_status || null);

    const [selection, setSelection] = useState([]);
    const [bulkZipName, setBulkZipName] = useState(null);
    const [isBulkMove, setIsBulkMove] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [searchQuery, setSearchQuery] = useState('');
    const fileUploadRef = useRef(null);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
    const dragCounter = useRef(0);

    const { data: folderData, setData: setFolderData, post: postFolder, processing: processingFolder, reset: resetFolder } = useForm({
        name: '',
        parent_id: folder?.id || null,
    });

    useEffect(() => {
        setFolderData('parent_id', folder?.id || null);
    }, [folder]);

    const { data: shareData, setData: setShareData, post: postShare, processing: processingShare } = useForm({
        shareable_type: '',
        shareable_id: '',
        permission: 'download',
        password: '',
        expires_at: '',
        max_downloads: '',
    });

    const { data: moveData, setData: setMoveData, post: postMove, processing: processingMove } = useForm({
        target_folder_id: '',
        item_ids: [],
    });

    const createFolder = (e) => {
        e.preventDefault();
        postFolder(route('folders.store'), {
            onSuccess: () => {
                resetFolder('name');
                setIsCreateFolderModalOpen(false);
            },
        });
    };

    const deleteItem = (type, id) => {
        if (confirm(`Move this ${type} to trash?`)) {
            router.delete(route(type === 'folder' ? 'folders.destroy' : 'files.destroy', id), {
                onSuccess: () => setSelection([]),
            });
        }
    };

    const bulkDelete = () => {
        if (confirm(`Move ${selection.length} items to trash?`)) {
            selection.forEach(item => {
                router.delete(route(item.type === 'folder' ? 'folders.destroy' : 'files.destroy', item.id), {
                    preserveScroll: true,
                    onSuccess: () => setSelection([]),
                });
            });
        }
    };

    const openMoveModal = (type, item) => {
        setIsBulkMove(false);
        setSelectedItem({ type, id: item.id, name: item.name || item.original_name });
        setMoveData('target_folder_id', item.parent_id || item.folder_id || '');
        setIsMoveModalOpen(true);
    };

    const openBulkMoveModal = () => {
        setIsBulkMove(true);
        setSelectedItem({ name: `${selection.length} items` });
        setMoveData('target_folder_id', '');
        setIsMoveModalOpen(true);
    };

    const handleMove = (e) => {
        e.preventDefault();

        if (isBulkMove) {
            router.post(route('bulk.move'), {
                selection,
                target_folder_id: moveData.target_folder_id === "0" ? null : moveData.target_folder_id
            }, {
                onSuccess: () => {
                    setIsMoveModalOpen(false);
                    setSelection([]);
                }
            });
            return;
        }

        const isFolder = selectedItem.type === 'folder';
        const url = isFolder
            ? route('folders.move', selectedItem.id)
            : route('files.move', selectedItem.id);

        const payload = isFolder
            ? { parent_id: moveData.target_folder_id === "0" ? null : moveData.target_folder_id }
            : { folder_id: moveData.target_folder_id === "0" ? null : moveData.target_folder_id };

        router.post(url, payload, {
            onSuccess: () => {
                setIsMoveModalOpen(false);
                setSelection([]);
            },
        });
    };

    const openShareModal = (type, item) => {
        setSelectedItem({ type, id: item.id, name: item.name || item.original_name });
        setShareData({
            shareable_type: type === 'folder' ? 'App\\Models\\Folder' : 'App\\Models\\File',
            shareable_id: item.id,
            permission: 'download',
            password: '',
            expires_at: '',
            max_downloads: '',
        });
        setShareUrl('');
        setIsShareModalOpen(true);
    };

    const handleShare = (e) => {
        e.preventDefault();
        axios.post(route('shares.store'), shareData).then(res => {
            setShareUrl(res.data.url);
        });
    };

    const openPreview = (file) => {
        setSelectedItem({ ...file, type: 'file' });
        setIsPreviewModalOpen(true);
    };

    const toggleSelection = (type, id) => {
        setSelection(prev => {
            const exists = prev.find(i => i.type === type && i.id === id);
            if (exists) {
                return prev.filter(i => !(i.type === type && i.id === id));
            } else {
                return [...prev, { type, id }];
            }
        });
    };

    const isSelected = (type, id) => !!selection.find(i => i.type === type && i.id === id);

    const sortData = useCallback((items, isFolder = false) => {
        return [...items].sort((a, b) => {
            let aValue, bValue;

            if (sortConfig.key === 'name') {
                aValue = (isFolder ? a.name : a.original_name).toLowerCase();
                bValue = (isFolder ? b.name : b.original_name).toLowerCase();
            } else if (sortConfig.key === 'size') {
                aValue = isFolder ? 0 : a.size;
                bValue = isFolder ? 0 : b.size;
            } else if (sortConfig.key === 'date') {
                aValue = new Date(a.created_at);
                bValue = new Date(b.created_at);
            } else if (sortConfig.key === 'type') {
                aValue = isFolder ? 'folder' : a.mime_type;
                bValue = isFolder ? 'folder' : b.mime_type;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sortConfig]);

    const sortedFolders = useMemo(() => sortData(folders, true), [folders, sortData]);
    const sortedFiles = useMemo(() => sortData(files, false), [files, sortData]);

    const filteredFolders = useMemo(() => sortedFolders.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [sortedFolders, searchQuery]);

    const filteredFiles = useMemo(() => sortedFiles.filter(f =>
        f.original_name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [sortedFiles, searchQuery]);

    const toggleSelectAll = () => {
        if (selection.length === (folders.length + files.length)) {
            setSelection([]);
        } else {
            const allItems = [
                ...folders.map(f => ({ type: 'folder', id: f.id })),
                ...files.map(f => ({ type: 'file', id: f.id }))
            ];
            setSelection(allItems);
        }
    };

    const requestZip = () => {
        if (!folder) return;
        axios.get(route('folders.download-zip', folder.id)).then(res => {
            setZipStatus(res.data.status);
        });
    };

    useEffect(() => {
        let interval;
        if (zipStatus === 'pending' || zipStatus === 'processing') {
            interval = setInterval(() => {
                axios.get(route('folders.zip-status', folder.id)).then(res => {
                    setZipStatus(res.data.status);
                    if (res.data.status === 'completed') {
                        clearInterval(interval);
                        if (confirm('ZIP generation complete. Download now?')) {
                            window.location.href = res.data.url;
                        }
                    }
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [zipStatus, folder]);

    useEffect(() => {
        let interval;
        if (bulkZipName) {
            interval = setInterval(() => {
                axios.get(route('bulk.download-status', bulkZipName)).then(res => {
                    if (res.data.status === 'completed') {
                        clearInterval(interval);
                        setBulkZipName(null);
                        window.location.href = res.data.url;
                    } else if (res.data.status === 'error') {
                        clearInterval(interval);
                        setBulkZipName(null);
                        alert('Failed to generate ZIP selection.');
                    }
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [bulkZipName]);

    const handleBulkDownload = () => {
        axios.post(route('bulk.download'), { selection }).then(res => {
            if (res.data.status === 'direct') {
                window.location.href = res.data.url;
            } else {
                setBulkZipName(res.data.zip_name);
            }
        });
    };

    useEffect(() => {
        const isBusy = () => {
            return fileUploadRef.current?.isBusy() || bulkZipName || zipStatus === 'pending' || zipStatus === 'processing';
        };

        const handleBeforeUnload = (e) => {
            if (isBusy()) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        const handleKeyDown = (e) => {
            // Block F5, Ctrl+R, Cmd+R
            if (isBusy()) {
                if (e.key === 'F5' ||
                    (e.ctrlKey && e.key === 'r') ||
                    (e.metaKey && e.key === 'r')) {
                    e.preventDefault();
                    alert('Upload/Processing in progress. Please do not refresh.');
                }
            }
        };

        const unbindInertia = router.on('before', (event) => {
            // Don't prompt for internal reloads or if not busy
            if (event.detail.visit.preserveState) return;

            if (isBusy() && !confirm('Active tasks will be lost. Are you sure you want to leave?')) {
                event.preventDefault();
            }
        });

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('keydown', handleKeyDown);
            unbindInertia();
        };
    }, [bulkZipName, zipStatus]);

    const refreshDashboard = () => router.reload();

    const handleGlobalDragEnter = (e) => {
        e.preventDefault();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDraggingGlobal(true);
        }
    };

    const handleGlobalDragLeave = (e) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDraggingGlobal(false);
        }
    };

    const handleGlobalDrop = (e) => {
        e.preventDefault();
        setIsDraggingGlobal(false);
        dragCounter.current = 0;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && fileUploadRef.current) {
            fileUploadRef.current.startUploads(files);
        }
    };

    const handleFilesUpload = (e) => {
        const files = e.target.files;
        if (files.length > 0 && fileUploadRef.current) {
            fileUploadRef.current.startUploads(files);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col lg:flex-row lg:justify-between justify-center items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 mb-4 lg:mb-0">
                        {folder ? folder.name : 'Dashboard'}
                    </h2>

                    <div className="flex-1 max-w-md mx-6 hidden md:block">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search your files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border-transparent rounded-2xl text-sm font-medium placeholder-gray-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="hidden md:block">
                            <StorageWidget storageUsed={storageUsed} totalFiles={totalFiles} />
                        </div>
                        {folder && (
                            <button
                                onClick={requestZip}
                                disabled={zipStatus === 'processing'}
                                className="text-sm bg-white text-gray-600 px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 flex items-center shadow-sm"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                {zipStatus === 'processing' ? 'Zipping...' : 'Download ZIP'}
                            </button>
                        )}

                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg font-bold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150 shadow-lg cursor-pointer">
                                    New +
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white shadow-xl ring-1 ring-black ring-opacity-5">
                                <button onClick={() => fileInputRef.current.click()} className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-50">
                                    <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                    Upload Files
                                </button>
                                <button onClick={() => folderInputRef.current.click()} className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition">
                                    <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                                    Upload Folder
                                </button>
                            </Dropdown.Content>
                        </Dropdown>

                        {/* Hidden Inputs */}
                        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFilesUpload} />
                        <input type="file" ref={folderInputRef} className="hidden" webkitdirectory="true" directory="true" multiple onChange={handleFilesUpload} />
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div
                className="py-12 relative min-h-[calc(100vh-64px)]"
                onDragEnter={handleGlobalDragEnter}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={handleGlobalDragLeave}
                onDrop={handleGlobalDrop}
            >
                {/* Full screen Drop Overlay */}
                {isDraggingGlobal && (
                    <div className="fixed inset-0 z-[100] bg-indigo-600/30 backdrop-blur-md border-4 border-dashed border-indigo-500 flex flex-col items-center justify-center p-10 transition-all pointer-events-none animate-in fade-in duration-200">
                        <div className="bg-white p-16 rounded-3xl shadow-2xl flex flex-col items-center animate-bounce-short border border-indigo-100">
                            <div className="bg-indigo-50 p-6 rounded-full mb-6">
                                <svg className="w-20 h-20 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h2 className="text-4xl font-black text-gray-900">Drop files here</h2>
                            <p className="text-gray-500 mt-3 font-medium text-lg">Your files will be uploaded automatically</p>
                        </div>
                    </div>
                )}

                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

                    {/* Background Uploader Component */}
                    <FileUpload ref={fileUploadRef} folderId={folder?.id} onUploadComplete={refreshDashboard} />

                    {/* Bulk Actions Toolbar */}
                    {selection.length > 0 && (
                        <div className="fixed bottom-24 lg:bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-xl text-white px-4 py-3 lg:px-8 lg:py-5 rounded-2xl lg:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[90] flex items-center space-x-4 lg:space-x-8 animate-in slide-in-from-bottom-5 duration-300 border border-white/10 w-[92vw] lg:w-auto justify-between lg:justify-start">
                            <div className="flex flex-col flex-shrink-0">
                                <span className="text-[8px] lg:text-[10px] uppercase font-black text-gray-400 leading-none">Selected</span>
                                <span className="text-sm lg:text-lg font-black leading-none mt-1">{selection.length}<span className="hidden lg:inline"> Items</span></span>
                            </div>

                            <div className="h-8 lg:h-10 w-px bg-white/10"></div>

                            <div className="flex items-center space-x-2 lg:space-x-6 overflow-x-auto no-scrollbar">
                                <button
                                    onClick={handleBulkDownload}
                                    disabled={bulkZipName}
                                    className="flex items-center text-indigo-400 hover:text-indigo-300 font-bold transition disabled:opacity-50 p-2 lg:p-0"
                                    title="Download"
                                >
                                    <svg className="w-5 h-5 lg:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    <span className="hidden lg:inline">{bulkZipName ? 'Preparing ZIP...' : 'Download'}</span>
                                </button>

                                <button
                                    onClick={openBulkMoveModal}
                                    className="flex items-center text-blue-400 hover:text-blue-300 font-bold transition p-2 lg:p-0"
                                    title="Move"
                                >
                                    <svg className="w-5 h-5 lg:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                    <span className="hidden lg:inline">Move</span>
                                </button>

                                <button
                                    onClick={bulkDelete}
                                    className="flex items-center text-red-400 hover:text-red-300 font-bold transition p-2 lg:p-0"
                                    title="Trash"
                                >
                                    <svg className="w-5 h-5 lg:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    <span className="hidden lg:inline">Trash</span>
                                </button>

                                <button
                                    onClick={() => setSelection([])}
                                    className="flex items-center text-gray-400 hover:text-white font-medium transition p-2 lg:p-0"
                                    title="Clear Selection"
                                >
                                    <svg className="w-5 h-5 lg:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    <span className="hidden lg:inline">Clear</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white/70 backdrop-blur-sm shadow-xl sm:rounded-3xl p-8 border border-white/40">

                        <div className="flex flex-col lg:flex-row lg:justify-between items-center mb-10">
                            <Breadcrumbs breadcrumbs={breadcrumbs} />

                            <div className="bg-gray-100/50 p-1.5 rounded-xl  flex space-x-1 items-center">

                                <button
                                    onClick={toggleSelectAll}
                                    className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all bg-indigo-600 text-white hover:bg-indigo-900 hover:shadow-sm   mr-2"
                                >
                                    {selection.length === (folders.length + files.length) ? 'Deselect All' : 'Select All'}
                                </button>
                                <div className="h-4 w-px bg-gray-300 mr-1"></div>
                                <button
                                    onClick={() => setIsCreateFolderModalOpen(true)}
                                    className="hidden lg:flex px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all hover:bg-white hover:shadow-sm text-gray-500 hover:text-indigo-600 mr-2 items-center"
                                >
                                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                                    New Folder
                                </button>
                                <div className="hidden lg:block h-4 w-px bg-gray-300 mr-1"></div>

                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all hover:bg-white hover:shadow-sm text-gray-500 hover:text-indigo-600 mr-2 flex items-center">
                                            Sort: {sortConfig.key}
                                            <svg className="w-3 h-3 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white shadow-xl rounded-xl border border-gray-50">
                                        {[
                                            { key: 'name', label: 'Name' },
                                            { key: 'size', label: 'Size' },
                                            { key: 'date', label: 'Date' },
                                            { key: 'type', label: 'Type' }
                                        ].map(opt => (
                                            <button
                                                key={opt.key}
                                                onClick={() => setSortConfig(prev => ({ key: opt.key, direction: prev.key === opt.key && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                                                className={`flex items-center w-full px-4 py-3 text-xs font-bold transition-all ${sortConfig.key === opt.key ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                {opt.label}
                                                {sortConfig.key === opt.key && (
                                                    <svg className={`w-3 h-3 ml-auto transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7"></path></svg>
                                                )}
                                            </button>
                                        ))}
                                    </Dropdown.Content>
                                </Dropdown>
                                <div className="h-4 w-px bg-gray-300 mr-1"></div>
                                <button
                                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                    className="p-2 rounded-lg transition-all text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm"
                                    title={viewMode === 'grid' ? 'Switch to List' : 'Switch to Grid'}
                                >
                                    {viewMode === 'grid' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5h7L14 8h6a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z"></path></svg>
                                    )}
                                </button>

                            </div>
                        </div>

                        {/* Mobile Search Bar */}
                        <div className="md:hidden mb-6 space-y-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                                />
                            </div>
                            <StorageWidget storageUsed={storageUsed} totalFiles={totalFiles} />
                        </div>

                        <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" : "space-y-2"}>
                            {filteredFolders.map((f) => (
                                <div
                                    key={f.id}
                                    className={`group relative border rounded-2xl hover:shadow-xl transition-all flex overflow-visible ${isSelected('folder', f.id) ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20' : 'bg-white border-gray-100 hover:border-indigo-100'
                                        } ${viewMode === 'grid' ? 'flex-col items-center p-6 h-52 justify-center text-center' : 'items-center px-6 py-4 justify-between h-16'}`}
                                >
                                    <div className={`absolute top-4 left-4 z-10 transition-opacity ${isSelected('folder', f.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected('folder', f.id)}
                                            onChange={() => toggleSelection('folder', f.id)}
                                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded-md focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </div>

                                    <Link href={route('dashboard', f.id)} className={`flex ${viewMode === 'grid' ? 'flex-col items-center' : 'items-center'} flex-1 w-full overflow-hidden hover:opacity-80 transition-opacity`}>
                                        <div className={`${viewMode === 'grid' ? 'mb-4' : 'mr-4'} relative`}>
                                            <svg className={`${viewMode === 'grid' ? 'w-20 h-20' : 'w-10 h-10'} text-indigo-500 filter drop-shadow-sm`} fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                            </svg>
                                        </div>
                                        <span className={`text-sm font-bold truncate w-full text-gray-800 ${viewMode === 'grid' ? 'px-2' : 'text-left'}`}>{f.name}</span>
                                    </Link>

                                    <div className={`${viewMode === 'grid' ? 'absolute top-4 right-4' : ''} z-20`}>
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button className="p-2 hover:bg-indigo-50 rounded-full text-gray-400 hover:text-indigo-600 transition-colors">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                                                </button>
                                            </Dropdown.Trigger>
                                            <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white shadow-2xl rounded-xl border border-gray-50 ring-1 ring-black ring-opacity-5">
                                                <button onClick={() => openShareModal('folder', f)} className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 transition border-b border-gray-50">
                                                    <svg className="w-4 h-4 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                                    Share Access
                                                </button>
                                                <button onClick={() => openMoveModal('folder', f)} className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 transition border-b border-gray-50">
                                                    <svg className="w-4 h-4 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                                    Move Folder
                                                </button>
                                                <button onClick={() => deleteItem('folder', f.id)} className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition font-bold">
                                                    <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    To Trash
                                                </button>
                                            </Dropdown.Content>
                                        </Dropdown>
                                    </div>
                                </div>
                            ))}

                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className={`group relative border rounded-2xl hover:shadow-xl transition-all flex overflow-visible ${isSelected('file', file.id) ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20' : 'bg-white border-gray-100 hover:border-indigo-100'
                                        } ${viewMode === 'grid' ? 'flex-col items-center p-6 h-52 justify-center text-center' : 'items-center px-6 py-4 justify-between h-16'}`}
                                >
                                    <div className={`absolute top-4 left-4 z-10 transition-opacity ${isSelected('file', file.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected('file', file.id)}
                                            onChange={() => toggleSelection('file', file.id)}
                                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded-md focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </div>

                                    <div
                                        onClick={() => openPreview(file)}
                                        className={`flex ${viewMode === 'grid' ? 'flex-col items-center' : 'items-center'} flex-1 w-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity`}
                                    >
                                        <div className={`${viewMode === 'grid' ? 'mb-4' : 'mr-4'} relative flex items-center justify-center`}>
                                            {file.mime_type?.startsWith('image/') ? (
                                                <div className={`${viewMode === 'grid' ? 'w-24 h-24' : 'w-10 h-10'} relative group/img`}>
                                                    <div className="absolute inset-0 flex items-center justify-center z-0">
                                                        <svg className={`${viewMode === 'grid' ? 'w-16 h-16' : 'w-8 h-8'} text-gray-200`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <img
                                                        src={route('preview.show', file.id)}
                                                        alt=""
                                                        loading="lazy"
                                                        className={`relative z-10 w-full h-full object-cover rounded-xl shadow-sm border border-gray-100 transition-transform group-hover/img:scale-105`}
                                                        onLoad={(e) => e.target.style.opacity = 1}
                                                        style={{ opacity: 0 }}
                                                    />
                                                </div>
                                            ) : (
                                                <svg className={`${viewMode === 'grid' ? 'w-20 h-20' : 'w-10 h-10'} text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className={`overflow-hidden w-full ${viewMode === 'grid' ? 'px-2' : 'text-left'}`}>
                                            <span className="text-sm font-bold truncate block text-gray-700">{file.original_name}</span>
                                            <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>

                                    <div className={`${viewMode === 'grid' ? 'absolute top-4 right-4' : ''} z-20`}>
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button className="p-2 hover:bg-indigo-50 rounded-full text-gray-400 hover:text-indigo-600 transition-colors">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                                                </button>
                                            </Dropdown.Trigger>
                                            <Dropdown.Content align="right" width="48" contentClasses="py-1 bg-white shadow-2xl rounded-xl border border-gray-50 ring-1 ring-black ring-opacity-5">
                                                <button onClick={() => openPreview(file)} className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 transition border-b border-gray-50">
                                                    <svg className="w-4 h-4 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                    Preview
                                                </button>
                                                <a href={route('files.download', file.id)} className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 transition border-b border-gray-50">
                                                    <svg className="w-4 h-4 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                    Download
                                                </a>
                                                <button onClick={() => openShareModal('file', file)} className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 transition border-b border-gray-50">
                                                    <svg className="w-4 h-4 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                                    Get Link
                                                </button>
                                                <button onClick={() => openMoveModal('file', file)} className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 transition border-b border-gray-50">
                                                    <svg className="w-4 h-4 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                                    Move Item
                                                </button>
                                                <button onClick={() => deleteItem('file', file.id)} className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition font-bold">
                                                    <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    To Trash
                                                </button>
                                            </Dropdown.Content>
                                        </Dropdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button for Mobile */}
            <button
                onClick={() => setIsCreateFolderModalOpen(true)}
                className={`lg:hidden fixed ${selection.length > 0 ? 'bottom-44' : 'bottom-24'} right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[90] active:scale-95 transition-all duration-300 border-4 border-white`}
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            </button>

            {/* Preview Modal */}
            <Modal show={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} maxWidth="5xl">
                <div className="p-0 bg-gray-900 min-h-[500px] relative flex flex-col rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-6 flex justify-between items-center text-white bg-black/40 backdrop-blur-md border-b border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Previewing</span>
                            <h3 className="font-black text-xl truncate max-w-lg">{selectedItem?.original_name}</h3>
                        </div>
                        <button onClick={() => setIsPreviewModalOpen(false)} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-gray-900 to-black">
                        {selectedItem?.mime_type?.startsWith('image/') ? (
                            <img
                                src={selectedItem?.id ? route('preview.show', selectedItem.id) : ''}
                                alt={selectedItem.original_name}
                                className="max-w-full max-h-[75vh] object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg animate-in zoom-in duration-300"
                            />
                        ) : selectedItem?.mime_type === 'application/pdf' ? (
                            <iframe
                                src={selectedItem?.id ? route('preview.show', selectedItem.id) : ''}
                                className="w-full h-[75vh] bg-white rounded-xl shadow-2xl"
                            />
                        ) : selectedItem?.mime_type?.startsWith('video/') ? (
                            <video controls className="max-w-full max-h-[75vh] shadow-2xl rounded-xl outline-none" autoPlay>
                                <source src={selectedItem?.id ? route('preview.show', selectedItem.id) : ''} type={selectedItem.mime_type} />
                            </video>
                        ) : (
                            <div className="text-center text-gray-400 p-24 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <div className="bg-white/5 p-8 rounded-full inline-block mb-6">
                                    <svg className="w-24 h-24 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-black text-gray-200">No Preview Ready</p>
                                <p className="text-gray-500 mt-2">This file type cannot be displayed in browser</p>
                                <a href={selectedItem?.id ? route('files.download', selectedItem.id) : '#'} className="mt-8 inline-flex items-center px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg">
                                    Download File
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-black/40 backdrop-blur-md flex justify-center space-x-6 border-t border-white/5">
                        <a href={selectedItem?.id ? route('files.download', selectedItem.id) : '#'} className="px-10 py-3 bg-white text-black hover:bg-gray-100 rounded-2xl font-black transition-all flex items-center shadow-xl transform active:scale-95">
                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Download Now
                        </a>
                    </div>
                </div>
            </Modal>

            {/* Move Modal */}
            <Modal show={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)}>
                <form onSubmit={handleMove} className="p-8">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Relocate</span>
                            <h3 className="text-2xl font-black text-gray-900 leading-none mt-1">Move "{selectedItem?.name}"</h3>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">Select Destination Folder</label>
                            <select
                                className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700 shadow-sm"
                                value={moveData.target_folder_id}
                                onChange={e => setMoveData('target_folder_id', e.target.value)}
                                required
                            >
                                <option value="0">/ Back to Home (Root)</option>
                                {allFolders.filter(f => f.id !== selectedItem?.id).map(f => (
                                    <option key={f.id} value={f.id}>
                                        {"📁 " + f.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                            <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                Moving an item will update its access path for shared links and change its organizational position.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 flex space-x-4">
                        <button type="button" onClick={() => setIsMoveModalOpen(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition">Cancel</button>
                        <PrimaryButton disabled={processingMove} className="flex-1 justify-center py-4 bg-indigo-600 rounded-2xl shadow-lg ring-4 ring-indigo-500/10">Move Now</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Create Folder Modal */}
            <Modal show={isCreateFolderModalOpen} onClose={() => setIsCreateFolderModalOpen(false)}>
                <form onSubmit={createFolder} className="p-8">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Workspace</span>
                            <h3 className="text-2xl font-black text-gray-900 leading-none mt-1">Create New Folder</h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Folder Name</label>
                        <input
                            type="text"
                            value={folderData.name}
                            onChange={e => setFolderData('name', e.target.value)}
                            placeholder="Enter folder name..."
                            className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-700 shadow-sm"
                            required
                            autoFocus
                        />
                        <p className="text-[10px] text-gray-400 font-medium italic">
                            Creating in: <span className="text-indigo-600 font-bold">{folder ? `/${folder.name}` : '/Root'}</span>
                        </p>
                    </div>

                    <div className="mt-10 flex space-x-4">
                        <button type="button" onClick={() => setIsCreateFolderModalOpen(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition">Cancel</button>
                        <PrimaryButton disabled={processingFolder} className="flex-1 justify-center py-4 bg-indigo-600 rounded-2xl shadow-lg ring-4 ring-indigo-500/10">Create Folder</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Share Modal */}
            <Modal show={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}>
                <div className="p-8">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="bg-green-100 p-3 rounded-2xl text-green-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Collaboration</span>
                            <h3 className="text-2xl font-black text-gray-900 leading-none mt-1">Share Link</h3>
                        </div>
                    </div>

                    {!shareUrl ? (
                        <form onSubmit={handleShare} className="space-y-6">
                            <div>
                                <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">Access Privileges</label>
                                <select
                                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                    value={shareData.permission}
                                    onChange={e => setShareData('permission', e.target.value)}
                                >
                                    <option value="view">Spectator Only</option>
                                    <option value="download">Access & Download</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">Confidentiality Password (Optional)</label>
                                <input type="password"
                                    placeholder="Unprotected"
                                    className="w-full bg-gray-50 border-gray-200 rounded-2xl p-4 focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                    value={shareData.password}
                                    onChange={e => setShareData('password', e.target.value)}
                                />
                            </div>
                            <div className="mt-10 flex space-x-4">
                                <button type="button" onClick={() => setIsShareModalOpen(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition">Cancel</button>
                                <PrimaryButton disabled={processingShare} className="flex-1 justify-center py-4 bg-indigo-600 rounded-2xl shadow-lg ring-4 ring-indigo-500/10">Generate Link</PrimaryButton>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <div className="mb-8 bg-green-50 p-6 rounded-3xl flex flex-col items-center border border-green-100">
                                <div className="bg-green-500 text-white p-2 rounded-full mb-3">
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                </div>
                                <span className="text-green-800 font-black text-xl">Dynamic Link Ready</span>
                            </div>
                            <div className="relative group">
                                <input readOnly value={shareUrl} className="w-full p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-sm text-indigo-700 font-mono shadow-inner focus:outline-none pr-16" />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareUrl);
                                        alert('Copied to clipboard!');
                                    }}
                                    className="absolute right-3 top-2.5 bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg active:scale-90"
                                    title="Copy"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                </button>
                            </div>
                            <div className="mt-10">
                                <PrimaryButton onClick={() => setIsShareModalOpen(false)} className="w-full justify-center py-4 bg-gray-900 rounded-2xl">Dismiss</PrimaryButton>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes bounce-short {
                    0%, 100% { transform: translate(-50%, 0); shadow: 0 40px 100px -12px rgba(67, 56, 202, 0.4); }
                    50% { transform: translate(-50%, -15px); shadow: 0 60px 120px -5px rgba(67, 56, 202, 0.5); }
                }
                .animate-bounce-short {
                    animation: bounce-short 3s infinite ease-in-out;
                }
            `}} />
        </AuthenticatedLayout>
    );
}
