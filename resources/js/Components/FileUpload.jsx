import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import axios from 'axios';

const FileUpload = forwardRef(({ folderId, onUploadComplete }, ref) => {
    const [queue, setQueue] = useState([]); // List of files to upload
    const [currentUpload, setCurrentUpload] = useState(null);
    const abortControllerRef = useRef(null);
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

    useImperativeHandle(ref, () => ({
        startUploads: (files) => {
            const newFiles = Array.from(files).map(file => ({
                id: Math.random().toString(36).substring(7),
                file, // This will be lost on refresh, but metadata can be saved
                relativePath: file.webkitRelativePath || file.name,
                status: 'pending'
            }));
            setQueue(prev => [...prev, ...newFiles]);
        },
        isBusy: () => queue.length > 0 || !!currentUpload
    }));

    // Main Processing Effect
    useEffect(() => {
        const processQueue = async () => {
            if (currentUpload || queue.length === 0) return;

            const next = queue.find(item => item.status === 'pending');
            if (!next) return;

            // Mark as processing
            setQueue(prev => prev.map(item => item.id === next.id ? { ...item, status: 'uploading' } : item));

            await performUpload(next);
        };

        processQueue();
    }, [queue, currentUpload]);

    const performUpload = async (item) => {
        const { file, relativePath } = item;

        // Safety check if file reference is lost (e.g. after some weird state update)
        if (!file) {
            setQueue(prev => prev.filter(q => q.id !== item.id));
            return;
        }

        setCurrentUpload({ id: item.id, name: file.name, progress: 0, paused: false });

        try {
            const { data: initData } = await axios.post(route('upload.init'), {
                filename: file.name,
                mime_type: file.type || 'application/octet-stream',
                folder_id: folderId,
                relative_path: relativePath,
            });

            const { upload_id, key, disk } = initData;
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const uploadedParts = [];

            for (let i = 1; i <= totalChunks; i++) {
                const start = (i - 1) * CHUNK_SIZE;
                const end = Math.min(i * CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const { data: signData } = await axios.post(route('upload.sign-part'), {
                    upload_id, key, part_number: i, disk
                });

                abortControllerRef.current = new AbortController();
                const response = await axios.put(signData.url, chunk, {
                    headers: { 'Content-Type': file.type || 'application/octet-stream' },
                    signal: abortControllerRef.current.signal,
                    onUploadProgress: (p) => {
                        const chunkProgress = (p.loaded / p.total);
                        const overall = ((i - 1 + chunkProgress) / totalChunks) * 100;
                        setCurrentUpload(prev => prev ? { ...prev, progress: Math.round(overall) } : null);
                    }
                });

                uploadedParts.push({
                    PartNumber: i,
                    ETag: response.headers.etag.replace(/"/g, ''),
                });
            }

            await axios.post(route('upload.complete'), {
                upload_id, key, parts: uploadedParts, disk,
                folder_id: folderId,
                filename: file.name,
                mime_type: file.type || 'application/octet-stream',
                size: file.size,
                relative_path: relativePath
            });

            setCurrentUpload(null);
            setQueue(prev => {
                const updatedQueue = prev.filter(q => q.id !== item.id);
                // Only trigger complete if this was the last item in queue
                if (updatedQueue.length === 0 && onUploadComplete) {
                    setTimeout(onUploadComplete, 100);
                }
                return updatedQueue;
            });

        } catch (error) {
            console.error('Upload failed', error);
            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error' } : q));
            setCurrentUpload(null);
        }
    };

    if (queue.length === 0 && !currentUpload) return null;

    return (
        <div className="fixed bottom-6 right-6 w-96 bg-white shadow-2xl rounded-2xl border border-gray-100 z-[100] overflow-hidden animate-in slide-in-from-right-10">
            <div className="bg-indigo-900 text-white p-4 flex justify-between items-center">
                <div className="flex items-center">
                    <div className="mr-2 animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full"></div>
                    <h3 className="font-black text-xs uppercase tracking-widest">Uploading Task ({queue.length})</h3>
                </div>
                <button onClick={() => setQueue([])} className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition">Cancel All</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
                {currentUpload && (
                    <div className="p-5 border-b bg-indigo-50/30">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black truncate w-48 text-indigo-900">{currentUpload.name}</span>
                            <span className="text-xs font-black text-indigo-600 bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">{currentUpload.progress}%</span>
                        </div>
                        <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden shadow-inner border border-indigo-200/50">
                            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${currentUpload.progress}%` }}></div>
                        </div>
                    </div>
                )}
                {queue.filter(q => q.status === 'pending').slice(0, 10).map(item => (
                    <div key={item.id} className="p-4 border-b flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span className="text-xs text-gray-600 truncate font-medium">{item.relativePath}</span>
                        </div>
                        <span className="text-[9px] bg-gray-100 px-2 py-1 rounded-md text-gray-500 uppercase font-black tracking-tighter">Waiting</span>
                    </div>
                ))}
                {queue.length > 10 && (
                    <div className="p-3 text-center text-[10px] text-gray-400 font-bold bg-gray-50/50 italic">
                        + {queue.length - 10} more files in queue...
                    </div>
                )}
            </div>

            {/* Warning about refresh */}
            <div className="bg-amber-50 p-2 text-[9px] text-amber-700 text-center font-bold border-t border-amber-100 uppercase tracking-widest">
                ⚠️ Processing Task - Do not close or refresh!
            </div>
        </div>
    );
});

FileUpload.displayName = 'FileUpload';
export default FileUpload;
