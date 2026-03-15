"use client";

import { useState, useRef, useCallback } from "react";
import { savePhotos, getPhotos, removePhoto } from "@/lib/adminStorage";

interface PhotoViewerProps {
  listId: string;
}

function resizeImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = img.width * scale;
        const h = img.height * scale;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoViewer({ listId }: PhotoViewerProps) {
  const [photos, setPhotos] = useState<string[]>(() => getPhotos(listId));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    photos.length > 0 ? 0 : null
  );
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPhotos = useCallback(
    async (files: FileList) => {
      const newPhotos: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const resized = await resizeImage(file, 1200);
        newPhotos.push(resized);
      }
      const updated = [...photos, ...newPhotos];
      setPhotos(updated);
      savePhotos(listId, updated);
      if (selectedIndex === null && updated.length > 0) {
        setSelectedIndex(0);
      }
    },
    [listId, photos, selectedIndex]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addPhotos(e.dataTransfer.files);
      }
    },
    [addPhotos]
  );

  const handleRemove = (index: number) => {
    removePhoto(listId, index);
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    if (selectedIndex !== null) {
      if (index === selectedIndex) {
        setSelectedIndex(updated.length > 0 ? Math.min(index, updated.length - 1) : null);
      } else if (index < selectedIndex) {
        setSelectedIndex(selectedIndex - 1);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Foto-referentie</h3>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs px-3 py-1 rounded-lg text-white cursor-pointer"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          + Foto
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addPhotos(e.target.files)}
        />
      </div>

      {photos.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer"
          style={{
            borderColor: dragging
              ? "var(--color-primary)"
              : "var(--color-primary-light)",
            backgroundColor: dragging ? "rgba(26,82,118,0.05)" : "transparent",
          }}
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-center text-text-light">
            <p className="text-3xl mb-2">+</p>
            <p className="text-sm">Sleep foto's hierheen of klik om te uploaden</p>
          </div>
        </div>
      ) : (
        <>
          {/* Main viewer */}
          <div
            className="flex-1 overflow-auto border rounded-lg mb-2 bg-gray-50"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              borderColor: dragging ? "var(--color-primary)" : "#e5e7eb",
            }}
          >
            {selectedIndex !== null && photos[selectedIndex] && (
              <img
                src={photos[selectedIndex]}
                alt={`Referentie ${selectedIndex + 1}`}
                className="w-full"
              />
            )}
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto py-1">
            {photos.map((photo, i) => (
              <div key={i} className="relative flex-shrink-0 group">
                <button
                  onClick={() => setSelectedIndex(i)}
                  className="w-16 h-16 rounded border-2 overflow-hidden cursor-pointer"
                  style={{
                    borderColor:
                      i === selectedIndex
                        ? "var(--color-primary)"
                        : "transparent",
                  }}
                >
                  <img
                    src={photo}
                    alt={`Thumb ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
                <button
                  onClick={() => handleRemove(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
