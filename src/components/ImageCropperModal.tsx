import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Upload, Image as ImageIcon } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (dataUrl: string) => void;
  aspectRatio?: number; // width / height, vertical 3/4 = 0.75 for product thumbnail
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  onCropComplete,
  aspectRatio = 3 / 4 // Vertical 3:4 portrait matching product cards
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleApplyCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    // Target output dimensions in vertical portrait shape
    const outputWidth = 600;
    const outputHeight = Math.round(outputWidth / aspectRatio); // 800 for 3:4 portrait

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    const previewWidth = aspectRatio >= 1 ? 360 : 270;
    const scaleFactor = outputWidth / previewWidth;

    ctx.save();
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Draw image centered with user offset
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawW = outputWidth;
    let drawH = outputWidth / imgAspect;

    if (imgAspect < aspectRatio) {
      drawH = outputHeight;
      drawW = outputHeight * imgAspect;
    }

    ctx.drawImage(
      img,
      -drawW / 2 + offset.x * scaleFactor,
      -drawH / 2 + offset.y * scaleFactor,
      drawW,
      drawH
    );
    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-60 overflow-y-auto bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-neutral-200 z-10 my-4 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-neutral-800" />
            <h3 className="font-heading font-bold text-lg text-neutral-900">
              {aspectRatio < 1 ? 'Crop Thumbnail Photo (Vertical)' : 'Crop Banner Photo'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {!imageSrc ? (
            <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-8 text-center flex flex-col items-center justify-center bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
              <Upload className="h-10 w-10 text-neutral-400 mb-3" />
              <p className="font-heading font-bold text-base text-neutral-900 mb-1">
                Upload Product Photo
              </p>
              <p className="text-xs text-neutral-500 mb-4">
                Vertical shape matching product thumbnails (3:4 portrait)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl cursor-pointer shadow-xs"
              >
                Choose Photo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cropping Viewport in vertical portrait ratio */}
              <div
                className="relative mx-auto rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 cursor-grab active:cursor-grabbing select-none"
                style={{
                  width: aspectRatio >= 1 ? '100%' : '240px',
                  aspectRatio: `${aspectRatio}`
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Rendered Image */}
                <div
                  className="w-full h-full flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.08s ease-out'
                  }}
                >
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Upload Preview"
                    className="max-w-full max-h-full object-contain pointer-events-none"
                  />
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none border-2 border-white/40 shadow-inner grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div />
                </div>
              </div>

              {/* Adjustments: Zoom Slider & Rotate */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <ZoomOut className="h-4 w-4" />
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-32 sm:w-44 accent-neutral-900 cursor-pointer"
                    />
                    <ZoomIn className="h-4 w-4" />
                  </div>

                  <button
                    type="button"
                    onClick={handleRotate}
                    className="p-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Rotate</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => {
                      setImageSrc(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
                  >
                    Change Photo
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCrop}
                      className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="h-4 w-4" />
                      <span>Apply Crop</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
