import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Check } from 'lucide-react';

interface AuthorImageUploaderProps {
  authorId: string;
  currentImageUrl?: string | null;
  onImageUploaded?: (imageUrl: string) => void;
}

export function AuthorImageUploader({ authorId, currentImageUrl, onImageUploaded }: AuthorImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.indexOf(file.type) === -1) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPEG, PNG, or GIF image.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e: any) => {
      setPreviewUrl(e.target?.result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Upload the image
      const response = await fetch(`/api/authors/${authorId}/image/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: 'Author image uploaded and processed successfully.',
        variant: 'success'
      });

      // Clear selection and preview
      setSelectedFile(null);
      setPreviewUrl("");
      
      // Reset file input
      const fileInput = document.getElementById('author-image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Notify parent component
      if (onImageUploaded) {
        onImageUploaded(result.imageUrl);
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error && error.message ? error.message : 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    
    // Reset file input
    const fileInput = document.getElementById('author-image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
      <div className="space-y-2">
        <Label htmlFor="author-image-input" className="text-sm font-medium text-blue-900">
          Author Profile Image
        </Label>
        <p className="text-xs text-blue-700">
          JPEG, PNG, GIF / At least 300 pixels in width and height. Will be converted to PNG and resized automatically.
        </p>
      </div>

      {/* Current Image Display */}
      {currentImageUrl && !previewUrl && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Current Image</Label>
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            <img 
              src={currentImageUrl} 
              alt="Current author image" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* File Input */}
      <div className="space-y-2">
        <Input
          id="author-image-input"
          type="file"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="text-sm"
        />
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Preview</Label>
          <div className="w-24 h-24 border-2 border-dashed border-blue-300 rounded-lg overflow-hidden">
            <img 
              src={previewUrl} 
              alt="Image preview" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {selectedFile && (
        <div className="flex gap-2">
          <Button 
            onClick={handleUpload} 
            disabled={isUploading}
            size="sm"
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                Upload & Process
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isUploading}
            size="sm"
          >
            <X className="w-3 h-3" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}