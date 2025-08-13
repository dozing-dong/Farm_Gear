import { ImageUp, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from './button';

interface ImageUploaderProps {
  onImageChange: (file: File | null) => void;
  preview?: string | null;
  error?: string;
  disabled?: boolean;
}

export function ImageUploader({ onImageChange, preview, error, disabled }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        onImageChange(null);
        return;
      }
      onImageChange(file);
    } else if (file) {
      onImageChange(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Equipment Image (Optional)
      </label>

      {/* Image preview area */}
      {preview && (
        <div className="mb-4 relative">
          <img
            src={preview}
            alt="Equipment preview"
            className="w-full max-w-md h-48 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={disabled}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 disabled:opacity-50"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Upload area */}
      {!preview && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center
            ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            disabled={disabled}
            className="hidden"
          />

          <div className="space-y-2">
            <ImageUp className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
            <div className="text-gray-600">
              <p className="text-sm">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Click to upload
                </span>{' '}
                or drag and drop image here
              </p>
              <p className="text-xs text-gray-500">
                Supports PNG, JPG, GIF formats, max file size 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Reselect button */}
      {preview && (
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="text-sm"
          >
            Change Image
          </Button>
        </div>
      )}
    </div>
  );
}
