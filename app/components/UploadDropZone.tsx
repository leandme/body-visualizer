"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type UploadDropzoneProps = {
  basePath?: "/";
  buttonLabel?: string;
};

export default function UploadDropzone({
  buttonLabel = "Upload Photo",
}: UploadDropzoneProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const navigateToPricing = () => {
    router.push("/pricing?uploaded=1");
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];

    if (!droppedFile) return;

    if (droppedFile.size > MAX_FILE_SIZE) {
      alert("File size exceeds 5MB. Please upload a smaller photo.");
      return;
    }

    setFileName(droppedFile.name);
    navigateToPricing();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];

    if (!uploadedFile) return;

    if (uploadedFile.size > MAX_FILE_SIZE) {
      alert("File size exceeds 5MB. Please upload a smaller photo.");
      return;
    }

    setFileName(uploadedFile.name);
    navigateToPricing();
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePasteUrlClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const url = window.prompt("Paste an image URL:");
    if (!url) return;

    const cleanedUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanedUrl)) {
      alert("Please paste a valid URL starting with http:// or https://.");
      return;
    }

    navigateToPricing();
  };

  return (
    <div
      className="flex flex-col items-center justify-center w-full max-w-lg p-6 border-2 border-dashed rounded-lg cursor-pointer border-gray-400 shadow-sm transition hover:shadow-md"
      onClick={handleButtonClick}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileUpload}
      />

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleButtonClick();
        }}
        className="btn btn-lg btn-primary mt-10 mb-5 text-white transform transition-transform duration-200 hover:scale-105"
      >
        <span className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-6 h-6 block"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9.5a1 1 0 0 0-2 0V19H5V5h9.5a1 1 0 0 0 0-2H5Zm7.5 5.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0ZM7 17l4.5-4.5 2.5 2.5 3.5-3.5L20 14.5V17H7Zm10-14v2h-2a1 1 0 0 0 0 2h2v2a1 1 0 0 0 2 0V7h2a1 1 0 0 0 0-2h-2V3a1 1 0 0 0-2 0Z" />
            </svg>
          </span>
          <span className="leading-none">{buttonLabel}</span>
        </span>
      </button>

      <div className="text-center text-gray-600">
        <p className="text-base mb-2">drop a photo here,</p>
        <button
          type="button"
          onClick={handlePasteUrlClick}
          className="text-xs mb-5 text-gray-600 hover:text-primary"
        >
          or paste <span className="underline underline-offset-2">URL</span>
        </button>
      </div>

      {fileName ? (
        <p className="mt-4 text-sm text-primary font-semibold">
          Uploaded File: {fileName}
        </p>
      ) : null}
    </div>
  );
}
