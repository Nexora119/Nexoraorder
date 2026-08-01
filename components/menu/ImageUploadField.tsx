"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  existingImageUrl?: string | null;
}

// Client Component, embedded within otherwise-server-rendered Add/Edit
// pages — file selection, preview, and remove/replace all require
// client-side state. The actual upload + processing (thumbnail/full
// generation) happens server-side inside the Server Action this form
// submits to — this component only handles what the browser needs before
// that submission: letting the owner see what they're about to upload,
// and expressing "remove the current image" as form data the action can
// read. The preview shown for an EXISTING image uses the thumbnail (the
// caller passes photo_thumbnail_url, falling back to photo_url) since
// it's smaller and faster to load here than the full version.
export function ImageUploadField({ existingImageUrl }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl ?? null);
  const [removed, setRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setRemoved(false);
    }
  }

  function handleRemove() {
    setPreviewUrl(null);
    setRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handlePickClick() {
    fileInputRef.current?.click();
  }

  return (
    <div>
      <label className="block text-small font-medium mb-1">
        Image <span className="text-text-secondary font-normal">(optional)</span>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        name="image"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <input type="hidden" name="remove_image" value={removed ? "true" : "false"} />

      {previewUrl ? (
        <div className="flex items-center gap-3 flex-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Menu item preview"
            className="w-20 h-20 rounded-md object-cover border border-border shrink-0"
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handlePickClick}>
              Replace image
            </Button>
            <Button type="button" variant="danger" onClick={handleRemove}>
              Remove image
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="secondary" onClick={handlePickClick}>
          Upload image
        </Button>
      )}

      <p className="text-small text-text-secondary mt-1">
        JPEG, PNG, or WebP. Max 5MB.
      </p>
    </div>
  );
}
