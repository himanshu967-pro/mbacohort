'use client';

import { useState, useRef, useCallback } from 'react';

interface GalleryUploadProps {
    onClose: () => void;
    onUploadComplete: () => void;
    albums: string[];
}

const UploadCloudIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
        <path d="M12 12v9"></path>
        <path d="m16 16-4-4-4 4"></path>
    </svg>
);

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
        <circle cx="9" cy="9" r="2"></circle>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

interface FilePreview {
    file: File;
    preview: string;
    caption: string;
}

export default function GalleryUpload({ onClose, onUploadComplete, albums }: GalleryUploadProps) {
    const [files, setFiles] = useState<FilePreview[]>([]);
    const [selectedAlbum, setSelectedAlbum] = useState(albums[0] || 'Random Photos');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((fileList: FileList | null) => {
        if (!fileList) return;

        const newFiles: FilePreview[] = [];
        Array.from(fileList).forEach(file => {
            if (file.type.startsWith('image/')) {
                newFiles.push({
                    file,
                    preview: URL.createObjectURL(file),
                    caption: ''
                });
            }
        });

        setFiles(prev => [...prev, ...newFiles]);
        setError(null);
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const removeFile = (index: number) => {
        setFiles(prev => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const updateCaption = (index: number, caption: string) => {
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, caption } : f));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            for (let i = 0; i < files.length; i++) {
                const { file, caption } = files[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('album', selectedAlbum);
                formData.append('caption', caption);

                const response = await fetch('/api/gallery/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Upload failed');
                }

                setProgress(Math.round(((i + 1) / files.length) * 100));
            }

            // Clean up previews
            files.forEach(f => URL.revokeObjectURL(f.preview));
            onUploadComplete();
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-modal-overlay" onClick={onClose}>
            <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
                <div className="upload-modal-header">
                    <h2>Upload Photos</h2>
                    <button className="upload-close" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>

                <div className="upload-modal-body">
                    {/* Album Selection */}
                    <div className="input-group">
                        <label className="label">Album</label>
                        <select
                            className="input select"
                            value={selectedAlbum}
                            onChange={(e) => setSelectedAlbum(e.target.value)}
                        >
                            {albums.map(album => (
                                <option key={album} value={album}>{album}</option>
                            ))}
                        </select>
                    </div>

                    {/* Drop Zone */}
                    <div
                        className={`upload-dropzone ${dragActive ? 'active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFiles(e.target.files)}
                            style={{ display: 'none' }}
                        />
                        <div className="upload-dropzone-content">
                            <UploadCloudIcon />
                            <p className="upload-dropzone-text">
                                Drag & drop photos here, or <span>browse</span>
                            </p>
                            <p className="upload-dropzone-hint">
                                Supports JPG, PNG, WebP (max 10MB each)
                            </p>
                        </div>
                    </div>

                    {/* File Previews */}
                    {files.length > 0 && (
                        <div className="upload-previews">
                            {files.map((file, index) => (
                                <div key={index} className="upload-preview-item">
                                    <div className="upload-preview-image">
                                        <img src={file.preview} alt={`Preview ${index + 1}`} />
                                        <button
                                            className="upload-preview-remove"
                                            onClick={() => removeFile(index)}
                                        >
                                            <XIcon />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="input upload-preview-caption"
                                        placeholder="Add a caption..."
                                        value={file.caption}
                                        onChange={(e) => updateCaption(index, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="upload-error">
                            {error}
                        </div>
                    )}

                    {/* Progress Bar */}
                    {uploading && (
                        <div className="upload-progress">
                            <div className="upload-progress-bar">
                                <div
                                    className="upload-progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="upload-progress-text">{progress}% uploaded</span>
                        </div>
                    )}
                </div>

                <div className="upload-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleUpload}
                        disabled={files.length === 0 || uploading}
                    >
                        <ImageIcon />
                        {uploading ? 'Uploading...' : `Upload ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
