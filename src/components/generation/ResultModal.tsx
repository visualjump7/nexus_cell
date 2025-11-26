'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string | null;
  mediaType: 'image' | 'video';
  platform: string;
}

export function ResultModal({ isOpen, onClose, mediaUrl, mediaType, platform }: ResultModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !mediaUrl) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-armory-${Date.now()}.${mediaType === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(mediaUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl w-full mx-4 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <span>Close</span>
          <span>✕</span>
        </button>

        {/* Platform Badge */}
        <div className="absolute -top-12 left-0 text-sm text-white/40">
          Generated with <span className="text-white">{platform}</span>
        </div>

        {/* Media Container */}
        <div className="rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-black">
          {mediaType === 'image' ? (
            <div className="relative aspect-video">
              <Image
                src={mediaUrl}
                alt="Generated image"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <video
              src={mediaUrl}
              controls
              autoPlay
              loop
              className="w-full"
            />
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <span className="animate-spin">◌</span>
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </>
            )}
          </button>
          
          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
          >
            {isCopied ? (
              <>
                <span>✓</span>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copy URL
              </>
            )}
          </button>

          <button
            onClick={() => window.open(mediaUrl, '_blank')}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Original
          </button>
        </div>
      </div>
    </div>
  );
}
