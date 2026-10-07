'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  X,
  Move,
  Circle,
  Square,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, croppedDataUrl: string) => void;
}

export default function ImageCropperModal({
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // State controls for cropping
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [cropShape, setCropShape] = useState<'circle' | 'square'>('circle');
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load image object
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImageObj(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
  }, [imageSrc]);

  // Draw crop preview on canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320; // Canvas dimensions
    canvas.width = size;
    canvas.height = size;

    // Clear background
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    ctx.save();

    // Center pivot point
    ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Calculate image draw dimensions maintaining aspect ratio
    const imgWidth = imageObj.naturalWidth || imageObj.width;
    const imgHeight = imageObj.naturalHeight || imageObj.height;

    const scaleFactor = Math.max(size / imgWidth, size / imgHeight);
    const drawWidth = imgWidth * scaleFactor;
    const drawHeight = imgHeight * scaleFactor;

    ctx.drawImage(
      imageObj,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    // Draw Overlay Mask outside crop zone
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.rect(0, 0, size, size);

    // Crop cutout
    const cropSize = 240;
    const cropRadius = cropSize / 2;
    const cropX = (size - cropSize) / 2;
    const cropY = (size - cropSize) / 2;

    if (cropShape === 'circle') {
      ctx.arc(size / 2, size / 2, cropRadius, 0, Math.PI * 2, true);
    } else {
      // Rounded square cutout
      ctx.rect(cropX, cropY, cropSize, cropSize);
    }
    ctx.fill('evenodd');

    // Draw Crop Border ring
    ctx.strokeStyle = '#10a37f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (cropShape === 'circle') {
      ctx.arc(size / 2, size / 2, cropRadius, 0, Math.PI * 2);
    } else {
      ctx.rect(cropX, cropY, cropSize, cropSize);
    }
    ctx.stroke();
  }, [imageObj, zoom, rotation, offset, cropShape]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse & Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  // Generate cropped output image Blob & File
  const handleApplyCrop = async () => {
    if (!imageObj) return;
    setIsProcessing(true);

    try {
      // Create high-resolution hidden canvas for output crop (512x512)
      const outSize = 512;
      const outCanvas = document.createElement('canvas');
      outCanvas.width = outSize;
      outCanvas.height = outSize;
      const ctx = outCanvas.getContext('2d');

      if (!ctx) throw new Error('Could not initialize canvas output.');

      // Clear
      ctx.clearRect(0, 0, outSize, outSize);

      // Apply crop clip shape if needed
      if (cropShape === 'circle') {
        ctx.beginPath();
        ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
        ctx.clip();
      }

      ctx.save();
      const previewSize = 320;
      const cropPreviewZone = 240;
      const scaleToOutput = outSize / cropPreviewZone;

      // Center pivot aligned with preview canvas crop area
      ctx.translate(
        outSize / 2 + offset.x * scaleToOutput,
        outSize / 2 + offset.y * scaleToOutput
      );
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom * scaleToOutput, zoom * scaleToOutput);

      const imgWidth = imageObj.naturalWidth || imageObj.width;
      const imgHeight = imageObj.naturalHeight || imageObj.height;
      const scaleFactor = Math.max(previewSize / imgWidth, previewSize / imgHeight);

      const drawWidth = imgWidth * scaleFactor;
      const drawHeight = imgHeight * scaleFactor;

      ctx.drawImage(
        imageObj,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
      ctx.restore();

      // Convert canvas to Data URL & Blob
      const croppedDataUrl = outCanvas.toDataURL('image/png', 0.95);

      outCanvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error('Failed to generate image file.');
          }
          const croppedFile = new File([blob], 'profile_avatar_cropped.png', {
            type: 'image/png',
          });
          onCropComplete(croppedFile, croppedDataUrl);
        },
        'image/png',
        0.95
      );
    } catch (err) {
      console.error('Error cropping image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181b] text-white rounded-3xl border border-zinc-800 max-w-md w-full overflow-hidden shadow-2xl space-y-0">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#10a37f]" />
            <h3 className="font-bold text-base tracking-wide text-white">
              Crop & Position Photo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Workspace */}
        <div className="p-6 flex flex-col items-center justify-center bg-zinc-950/60 relative">
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-zinc-800 cursor-grab active:cursor-grabbing select-none">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="touch-none"
            />

            {/* Instruction Badge overlay */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-medium text-zinc-300 flex items-center gap-1.5 border border-white/10 pointer-events-none">
              <Move className="w-3 h-3 text-[#10a37f]" />
              <span>Drag to reposition</span>
            </div>
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="p-5 space-y-4 bg-[#18181b] border-t border-zinc-800">
          {/* Zoom & Shape Controls */}
          <div className="flex items-center justify-between gap-4">
            {/* Zoom Slider */}
            <div className="flex items-center gap-2 flex-1">
              <ZoomOut className="w-4 h-4 text-zinc-400" />
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#10a37f]"
              />
              <ZoomIn className="w-4 h-4 text-zinc-400" />
            </div>

            {/* Rotation Button */}
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-4 h-4 text-[#10a37f]" />
              <span>{rotation}°</span>
            </button>

            {/* Mask Shape Toggle */}
            <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800">
              <button
                onClick={() => setCropShape('circle')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  cropShape === 'circle'
                    ? 'bg-[#10a37f] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Circular Crop"
              >
                <Circle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCropShape('square')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  cropShape === 'square'
                    ? 'bg-[#10a37f] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Square Crop"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reset position & Footer actions */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
            <button
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
                setRotation(0);
              }}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Position</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCrop}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-[#10a37f] hover:bg-[#0e8c6d] text-white text-xs font-bold transition-all shadow-md shadow-[#10a37f]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessing ? 'Cropping...' : 'Apply & Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
