// Avatar upload dialog component

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AvatarUploadDialog = React.memo<AvatarUploadDialogProps>(({ open, onOpenChange }) => {
  const { updateUser, user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!preview || !selectedFile) return;

    setIsUploading(true);
    
    try {
      const response = await authService.uploadAvatar(selectedFile);
      
      // Update user in auth context
      if (user) {
        updateUser({ ...user, avatar_url: response.avatar_url });
      }

      toast.success('Avatar updated successfully');
      setPreview(null);
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [preview, selectedFile, user, updateUser, onOpenChange]);

  const handleRemovePreview = useCallback(() => {
    setPreview(null);
    setSelectedFile(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Upload Avatar</DialogTitle>
          <DialogDescription className="text-xs">
            Choose an image for your profile (max 5MB)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Avatar preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={handleRemovePreview}
                className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">Click to upload image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!preview || isUploading}
              className="text-xs"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

AvatarUploadDialog.displayName = 'AvatarUploadDialog';
