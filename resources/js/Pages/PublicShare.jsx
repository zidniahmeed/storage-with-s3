import { Head } from '@inertiajs/react';

export default function PublicShare({ share, file, folder, folders, files }) {
    const handleDownload = (fileId = null) => {
        const url = fileId
            ? route('shares.download', { uuid: share.uuid, file: fileId })
            : route('shares.download', { uuid: share.uuid });
        window.location.href = url;
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12">
            <Head title={file ? file.original_name : folder.name} />
            <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                    <div className="flex items-center justify-between mb-8 border-b pb-4">
                        <div className="flex items-center">
                            {file ? (
                                <svg className="w-10 h-10 text-gray-400 mr-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-10 h-10 text-blue-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                </svg>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{file ? file.original_name : folder.name}</h1>
                                <p className="text-gray-500 text-sm">Shared by Family Storage</p>
                            </div>
                        </div>
                        {share.permission === 'download' && file && (
                            <button
                                onClick={() => handleDownload()}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                Download
                            </button>
                        )}
                    </div>

                    {file && (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg">
                            <p className="text-gray-600 mb-4">File preview is not available here. Download to view.</p>
                            <span className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                    )}

                    {folder && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {folders.map(f => (
                                        <tr key={f.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center">
                                                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                                </svg>
                                                {f.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <span className="text-gray-400 italic text-xs">Folder view only</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {files.map(f => (
                                        <tr key={f.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center">
                                                <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                </svg>
                                                {f.original_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(f.size / 1024 / 1024).toFixed(2)} MB</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {share.permission === 'download' && (
                                                    <button onClick={() => handleDownload(f.id)} className="text-blue-600 hover:text-blue-900 font-semibold">Download</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {share.permission === 'download' && (
                                <div className="mt-8 text-center">
                                    <button
                                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition"
                                        onClick={() => handleDownload()}
                                    >
                                        Download All (ZIP)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
