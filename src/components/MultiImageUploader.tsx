import React, { useState, useEffect } from 'react';

interface MultiImageUploaderProps {
  files: File[] | null;
  setFiles: (files: File[] | null) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ files, setFiles, maxFiles = 10, maxSizeMB = 5 }) => {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (files && files.length) {
      const urls = files.map((file) => URL.createObjectURL(file));
      setPreviews(urls);
      return () => urls.forEach((url) => URL.revokeObjectURL(url));
    } else {
      setPreviews([]);
    }
  }, [files]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      const oversize = selected.find((f) => f.size > maxSizeMB * 1024 * 1024);
      if (oversize) {
        alert(`File ${oversize.name} exceeds ${maxSizeMB}MB limit.`);
        return;
      }
      const total = files ? files.concat(selected) : selected;
      if (total.length > maxFiles) {
        alert(`You can select up to ${maxFiles} images.`);
        return;
      }
      setFiles(total);
    }
  };

  const removeImage = (index: number) => {
    if (files) {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      setFiles(newFiles.length ? newFiles : null);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
        Upload Images (max {maxFiles})
      </label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="hidden"
        id="multi-image-input"
      />
      <label htmlFor="multi-image-input" className="cursor-pointer inline-block bg-gold-100 dark:bg-white/5 text-gold-700 dark:text-gold-300 px-4 py-2 rounded-xl hover:bg-gold-200 dark:hover:bg-white/10 transition">
        Choose Files
      </label>
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {previews.map((src, idx) => (
            <div key={idx} className="relative rounded-xl overflow-hidden border border-gold-200/30">
              <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
