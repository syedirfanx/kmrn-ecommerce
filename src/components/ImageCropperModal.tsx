import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Check,
  Upload,
  Image as ImageIcon,
  Move,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Grid3X3,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sliders
} from 'lucide-react';

export interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (dataUrl: string) => void;
  initialImage?: string | null;
  aspectRatio?: number; // width / height: 0.75 for 3:4 portrait, 16/9 for banners, 1 for square logo
  title?: string;
  description?: string;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  onCropComplete,
  initialImage = null,
  aspectRatio = 3 / 4,
  title,
  description
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'transform' | 'adjust'>('transform');
  const [currentAspectRatio, setCurrentAspectRatio] = useState<number>(aspectRatio);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  // Sync aspect ratio prop when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      setCurrentAspectRatio(aspectRatio);
    }
  }, [isOpen, aspectRatio]);

  // Load initial image or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialImage) {
        setImageSrc(initialImage);
      } else {
        setImageSrc(null);
      }
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setFlipH(false);
      setFlipV(false);
      setBrightness(100);
      setContrast(100);
      setShowGrid(true);
      setActiveTab('transform');
    }
  }, [isOpen, initialImage]);

  // Handle image load to capture natural dimensions
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // Global mousemove and mouseup listeners to prevent drag drops when cursor leaves box
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Wheel zoom listener inside the viewport
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = 0.08;
    const delta = e.deltaY < 0 ? zoomStep : -zoomStep;
    setZoom((prev) => {
      const next = Math.max(0.6, Math.min(4, Number((prev + delta).toFixed(2))));
      return next;
    });
  };

  // Drag start handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    };
  };

  // Touch handlers (pan and pinch zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setOffset({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchDistanceRef.current;
      touchDistanceRef.current = dist;
      setZoom((prev) => Math.max(0.6, Math.min(4, Number((prev * factor).toFixed(2)))));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setFlipH(false);
      setFlipV(false);
      setBrightness(100);
      setContrast(100);
    };
    reader.readAsDataURL(file);
  };

  // Reposition helpers (nudge buttons)
  const nudge = (dx: number, dy: number) => {
    setOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
  };

  const resetPosition = () => {
    setOffset({ x: 0, y: 0 });
  };

  const resetAllAdjustments = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
  };

  // Fit to frame vs Fill frame
  const handleFitFrame = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleFillFrame = useCallback(() => {
    if (!imgNaturalSize.width || !imgNaturalSize.height || !viewportRef.current) return;
    const imgAspect = imgNaturalSize.width / imgNaturalSize.height;
    const vpAspect = currentAspectRatio;
    let targetZoom = 1;
    if (imgAspect >= vpAspect) {
      targetZoom = imgAspect / vpAspect;
    } else {
      targetZoom = vpAspect / imgAspect;
    }
    setZoom(Math.max(1, Math.min(3.5, Number(targetZoom.toFixed(2)))));
    setOffset({ x: 0, y: 0 });
  }, [imgNaturalSize, currentAspectRatio]);

  // Rotations
  const rotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateCounterClockwise = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  // Final crop export (WYSIWYG 100% exact math)
  const handleApplyCrop = () => {
    if (!imageRef.current || !viewportRef.current) return;
    const img = imageRef.current;
    const viewport = viewportRef.current;

    const viewportW = viewport.clientWidth;
    const viewportH = viewport.clientHeight;

    // Targeted high-resolution dimensions
    const isSquareLogo = currentAspectRatio === 1;
    let outputWidth = 1200;
    if (isSquareLogo) {
      outputWidth = 480;
    } else if (currentAspectRatio < 1) {
      // 3:4 portrait product thumbnail: 750 x 1000 px
      outputWidth = 750;
    } else {
      // 16:9 widescreen landscape banner: 1280 x 720 px
      outputWidth = 1280;
    }
    const outputHeight = Math.round(outputWidth / currentAspectRatio);

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d', { alpha: isSquareLogo });
    if (!ctx) return;

    // High quality bicubic resampling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (!isSquareLogo) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outputWidth, outputHeight);
    }

    // Apply brightness and contrast filters
    if (brightness !== 100 || contrast !== 100) {
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    }

    // Exact scale factor between preview pixels and canvas pixels
    const k = outputWidth / viewportW;

    // Natural aspect vs viewport aspect
    const imgNaturalAspect = img.naturalWidth / img.naturalHeight;
    const vpAspect = viewportW / viewportH;
    let renderedW: number;
    let renderedH: number;

    if (imgNaturalAspect >= vpAspect) {
      renderedW = viewportW;
      renderedH = viewportW / imgNaturalAspect;
    } else {
      renderedH = viewportH;
      renderedW = viewportH * imgNaturalAspect;
    }

    const canvasDrawW = renderedW * k;
    const canvasDrawH = renderedH * k;

    ctx.save();
    // 1. Move canvas origin to the image's transformed center (accounting for offset):
    ctx.translate(outputWidth / 2 + offset.x * k, outputHeight / 2 + offset.y * k);
    // 2. Rotate around image center:
    ctx.rotate((rotation * Math.PI) / 180);
    // 3. Scale and flip around image center:
    ctx.scale(zoom * (flipH ? -1 : 1), zoom * (flipV ? -1 : 1));
    // 4. Draw image centered at (0, 0):
    ctx.drawImage(img, -canvasDrawW / 2, -canvasDrawH / 2, canvasDrawW, canvasDrawH);
    ctx.restore();

    let croppedDataUrl: string;
    if (isSquareLogo) {
      croppedDataUrl = canvas.toDataURL('image/png');
      if (croppedDataUrl.length > 70000) {
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outputWidth, outputHeight);
        croppedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
      }
    } else {
      let quality = 0.82;
      croppedDataUrl = canvas.toDataURL('image/jpeg', quality);
      // Ensure file doesn't exceed 60KB so Firestore documents never get bloated
      while (croppedDataUrl.length > 60000 && quality > 0.45) {
        quality -= 0.05;
        croppedDataUrl = canvas.toDataURL('image/jpeg', quality);
      }
    }

    onCropComplete(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  // Viewport display styling
  const isLandscape = currentAspectRatio > 1;
  const isSquare = currentAspectRatio === 1;
  const viewportWidthStyle = isLandscape ? '100%' : isSquare ? '260px' : '230px';
  const viewportHeightPx = isLandscape ? 220 : isSquare ? 260 : 306;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-60 overflow-y-auto bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-neutral-200 z-10 my-4 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-neutral-900 leading-tight">
                {title || (
                  isSquare
                    ? 'Crop Category Logo (1:1)'
                    : isLandscape
                    ? 'Crop Banner Photo (16:9 Landscape)'
                    : 'Crop Product Photo (3:4 Portrait)'
                )}
              </h3>
              <p className="text-[11px] text-stone-500 leading-tight">
                {description || 'Drag to reposition • Scroll or pinch to zoom • Rotate & adjust'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {!imageSrc ? (
            /* Upload Dropzone */
            <div className="border-2 border-dashed border-stone-300 rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center justify-center bg-stone-50/70 hover:bg-stone-50 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center mb-3 text-neutral-700">
                <Upload className="h-7 w-7 text-neutral-600" />
              </div>
              <p className="font-heading font-bold text-base text-neutral-900 mb-1">
                Upload & Prepare Image
              </p>
              <p className="text-xs text-stone-500 mb-4 max-w-sm text-center">
                {description ||
                  (isSquare
                    ? 'Square 1:1 format for brand logos and collection badges.'
                    : isLandscape
                    ? 'Widescreen 16:9 ratio for carousel banners and hero covers.'
                    : 'Portrait 3:4 ratio for product gallery and catalog displays.')}
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
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-2"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Choose Photo from Device</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Aspect Ratio Selector Bar */}
              <div className="flex items-center justify-between gap-2 text-xs pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-stone-500 text-[11px] uppercase tracking-wider">Aspect:</span>
                  <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setCurrentAspectRatio(3 / 4)}
                      className={`px-2 py-1 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                        currentAspectRatio === 3 / 4
                          ? 'bg-white text-neutral-900 shadow-xs'
                          : 'text-stone-500 hover:text-neutral-900'
                      }`}
                    >
                      3:4 Portrait
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentAspectRatio(16 / 9)}
                      className={`px-2 py-1 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                        currentAspectRatio === 16 / 9
                          ? 'bg-white text-neutral-900 shadow-xs'
                          : 'text-stone-500 hover:text-neutral-900'
                      }`}
                    >
                      16:9 Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentAspectRatio(1)}
                      className={`px-2 py-1 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                        currentAspectRatio === 1
                          ? 'bg-white text-neutral-900 shadow-xs'
                          : 'text-stone-500 hover:text-neutral-900'
                      }`}
                    >
                      1:1 Square
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    showGrid
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                  title="Toggle Rule-of-Thirds Grid"
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-[11px]">Grid</span>
                </button>
              </div>

              {/* Viewport Box */}
              <div className="bg-neutral-900 p-3 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div
                  ref={viewportRef}
                  className={`relative rounded-xl overflow-hidden bg-neutral-950 border-2 border-white/30 select-none shadow-2xl ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{
                    width: viewportWidthStyle,
                    height: isLandscape ? `${viewportHeightPx}px` : undefined,
                    aspectRatio: isLandscape ? undefined : `${currentAspectRatio}`
                  }}
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Rendered Image */}
                  <div
                    className="w-full h-full flex items-center justify-center pointer-events-none"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${
                        zoom * (flipH ? -1 : 1)
                      }, ${zoom * (flipV ? -1 : 1)})`,
                      transformOrigin: 'center center',
                      filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                      willChange: isDragging ? 'transform' : 'auto'
                    }}
                  >
                    <img
                      ref={imageRef}
                      src={imageSrc}
                      crossOrigin="anonymous"
                      alt="Crop Preview"
                      onLoad={onImageLoad}
                      className="max-w-full max-h-full object-contain pointer-events-none select-none"
                    />
                  </div>

                  {/* Rule of Thirds Grid Overlay */}
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                      <div className="border-r border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-b border-white/25" />
                      <div className="border-r border-white/25" />
                      <div className="border-r border-white/25" />
                      <div />
                    </div>
                  )}

                  {/* Corner Accent Markers */}
                  <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
                  <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
                  <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
                  <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none" />

                  {/* Pan Hint Overlay Badge */}
                  <div className="absolute bottom-2 left-2 bg-neutral-900/80 backdrop-blur-xs text-white/90 text-[10px] px-2 py-0.5 rounded-md pointer-events-none flex items-center gap-1 border border-white/10 font-mono">
                    <Move className="h-2.5 w-2.5" />
                    <span>Drag to pan</span>
                  </div>
                </div>
              </div>

              {/* Sub-tabs for Transform vs Adjustments */}
              <div className="flex border-b border-stone-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('transform')}
                  className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'transform'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-stone-500 hover:text-neutral-700'
                  }`}
                >
                  <Move className="h-3.5 w-3.5" />
                  <span>Crop & Reposition</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('adjust')}
                  className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'adjust'
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-stone-500 hover:text-neutral-700'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Rotate & Adjustments</span>
                </button>
              </div>

              {/* TAB 1: Transform & Reposition */}
              {activeTab === 'transform' && (
                <div className="space-y-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  {/* Zoom Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setZoom((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))}
                        className="p-1 rounded-md bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="range"
                        min="0.6"
                        max="3.5"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-32 sm:w-44 accent-neutral-900 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setZoom((prev) => Math.min(3.5, Number((prev + 0.1).toFixed(2))))}
                        className="p-1 rounded-md bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-mono text-xs font-bold text-neutral-800 w-12 text-right">
                        {Math.round(zoom * 100)}%
                      </span>
                    </div>

                    {/* Quick Fit / Fill shortcuts */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleFitFrame}
                        className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        title="Fit whole image within frame"
                      >
                        <Minimize2 className="h-3 w-3" />
                        <span>Fit</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleFillFrame}
                        className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        title="Zoom to cover all edges without blank border"
                      >
                        <Maximize2 className="h-3 w-3" />
                        <span>Fill Frame</span>
                      </button>
                    </div>
                  </div>

                  {/* Nudge Repositioning Toolbar */}
                  <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Reposition Nudge:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => nudge(-8, 0)}
                        className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg cursor-pointer transition-colors shadow-xs"
                        title="Nudge Left"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudge(0, -8)}
                        className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg cursor-pointer transition-colors shadow-xs"
                        title="Nudge Up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudge(0, 8)}
                        className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg cursor-pointer transition-colors shadow-xs"
                        title="Nudge Down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudge(8, 0)}
                        className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg cursor-pointer transition-colors shadow-xs"
                        title="Nudge Right"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={resetPosition}
                        className="ml-2 px-2 py-1 bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors shadow-xs"
                        title="Center Image"
                      >
                        Center
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Rotation & Adjustments */}
              {activeTab === 'adjust' && (
                <div className="space-y-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs">
                  {/* Rotation & Flip Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={rotateCounterClockwise}
                        className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-neutral-800 border border-stone-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        title="Rotate -90°"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>-90°</span>
                      </button>
                      <button
                        type="button"
                        onClick={rotateClockwise}
                        className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-neutral-800 border border-stone-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        title="Rotate +90°"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>+90°</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFlipH(!flipH)}
                        className={`px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs ${
                          flipH
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white hover:bg-stone-100 text-neutral-800 border-stone-200'
                        }`}
                        title="Flip Horizontally (Mirror)"
                      >
                        <FlipHorizontal className="h-3.5 w-3.5" />
                        <span>Flip H</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlipV(!flipV)}
                        className={`px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs ${
                          flipV
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white hover:bg-stone-100 text-neutral-800 border-stone-200'
                        }`}
                        title="Flip Vertically"
                      >
                        <FlipVertical className="h-3.5 w-3.5" />
                        <span>Flip V</span>
                      </button>
                    </div>
                  </div>

                  {/* Fine Straighten Tilt Slider */}
                  <div className="pt-2 border-t border-stone-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
                      <span>Fine Straighten / Tilt Angle</span>
                      <span className="font-mono">{rotation}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        step="0.5"
                        value={((rotation + 180) % 360) - 180}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setRotation(val < 0 ? 360 + val : val);
                        }}
                        className="w-full accent-neutral-900 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setRotation(0)}
                        className="text-[10px] text-stone-500 hover:text-neutral-900 font-bold px-1.5 py-0.5 rounded-md bg-white border border-stone-200 cursor-pointer"
                      >
                        0°
                      </button>
                    </div>
                  </div>

                  {/* Brightness & Contrast Sliders */}
                  <div className="pt-2 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
                        <span className="flex items-center gap-1">
                          <Sun className="h-3 w-3" /> Brightness
                        </span>
                        <span className="font-mono">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="70"
                        max="130"
                        step="1"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="w-full accent-neutral-900 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
                        <span>Contrast</span>
                        <span className="font-mono">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="70"
                        max="130"
                        step="1"
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value))}
                        className="w-full accent-neutral-900 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Reset All */}
                  <div className="pt-2 border-t border-stone-200/80 flex justify-end">
                    <button
                      type="button"
                      onClick={resetAllAdjustments}
                      className="text-[11px] text-stone-500 hover:text-neutral-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Reset All Adjustments</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-200">
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
                  className="text-xs font-bold text-stone-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Replace Photo</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCrop}
                    className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    <span>Apply & Save Photo</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
