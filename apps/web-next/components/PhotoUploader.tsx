"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { X, Plus } from "lucide-react";

const MAX_PHOTOS = 3;

export default function PhotoUploader() {
  const [photos, setPhotos] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_PHOTOS - photos.length;
    files.slice(0, remaining).forEach((file) => {
      const url = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, url]);
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const slots = Array.from({ length: MAX_PHOTOS });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {slots.map((_, i) => {
          const photo = photos[i];
          return (
            <div
              key={i}
              className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                photo
                  ? "border-transparent"
                  : "border-dashed border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50 cursor-pointer"
              }`}
              onClick={!photo ? () => inputRef.current?.click() : undefined}
            >
              {photo ? (
                <>
                  <Image
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                    unoptimized
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(i);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {i === 0 && (
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/60 text-white text-[10px] font-semibold rounded-full">
                      Main
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-400">
                  <Plus className="w-6 h-6" />
                  <span className="text-[10px] font-medium text-center px-1 leading-tight">
                    {i === 0 ? "Add main photo" : "Add photo"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 text-center">
        Upload up to {MAX_PHOTOS} photos · First photo is your main
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
