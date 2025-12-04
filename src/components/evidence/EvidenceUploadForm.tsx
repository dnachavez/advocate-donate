import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, X, ImageIcon, Plus } from "lucide-react";
import { uploadImage, validateImageFile, createImagePreview, revokeImagePreview } from '@/lib/imageUpload';
import { evidenceService } from '@/services/evidenceService';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ImpactEvidence } from '@/types/organizations';

interface EvidenceUploadFormProps {
    targetType: 'campaign' | 'organization';
    targetId: string;
    initialData?: ImpactEvidence;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const EvidenceUploadForm: React.FC<EvidenceUploadFormProps> = ({
    targetType,
    targetId,
    initialData,
    onSuccess,
    onCancel
}) => {
    const { user } = useAuth();
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    // Store new files to upload
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    // Store previews for new files
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    // Store existing image URLs (for editing)
    const [existingImages, setExistingImages] = useState<string[]>(initialData?.media_urls || []);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const validFiles: File[] = [];
        const newPreviews: string[] = [];

        Array.from(files).forEach(file => {
            const validation = validateImageFile(file);
            if (!validation.isValid) {
                toast({
                    title: 'Invalid file',
                    description: `${file.name}: ${validation.error}`,
                    variant: 'destructive',
                });
                return;
            }
            validFiles.push(file);
            newPreviews.push(createImagePreview(file));
        });

        setNewImageFiles(prev => [...prev, ...validFiles]);
        setNewImagePreviews(prev => [...prev, ...newPreviews]);

        // Reset input
        e.target.value = '';
    };

    const handleRemoveNewImage = (index: number) => {
        revokeImagePreview(newImagePreviews[index]);
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const totalImages = existingImages.length + newImageFiles.length;

        if (!title.trim() || !description.trim() || totalImages === 0) {
            toast({
                title: 'Missing information',
                description: 'Please provide a title, description, and at least one image.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            setUploading(true);

            // Upload new images
            const uploadedUrls: string[] = [];
            if (newImageFiles.length > 0) {
                console.log(`Uploading ${newImageFiles.length} images...`);

                // Upload in parallel
                const uploadPromises = newImageFiles.map(file => uploadImage(file));
                const results = await Promise.all(uploadPromises);

                for (const result of results) {
                    if (result.error) throw new Error(result.error);
                    if (!result.url) throw new Error('Failed to upload image - no URL returned');
                    uploadedUrls.push(result.url);
                }
            }

            const finalMediaUrls = [...existingImages, ...uploadedUrls];

            setUploading(false);

            if (initialData) {
                console.log('Updating evidence...');
                await evidenceService.updateEvidence(initialData.id, {
                    title: title.trim(),
                    description: description.trim(),
                    media_urls: finalMediaUrls,
                });
                toast({
                    title: 'Evidence updated',
                    description: 'Your impact evidence has been successfully updated.',
                });
            } else {
                console.log('Submitting new evidence...');
                await evidenceService.submitEvidence({
                    target_type: targetType,
                    target_id: targetId,
                    title: title.trim(),
                    description: description.trim(),
                    media_urls: finalMediaUrls,
                    created_by: user.id
                });
                toast({
                    title: 'Evidence submitted',
                    description: 'Your impact evidence has been successfully submitted.',
                });
            }

            // Reset form
            setTitle('');
            setDescription('');
            setNewImageFiles([]);
            setNewImagePreviews([]);
            setExistingImages([]);

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error submitting evidence:', error);
            toast({
                title: 'Submission failed',
                description: error instanceof Error ? error.message : 'Failed to submit evidence',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    // Cleanup previews on unmount
    useEffect(() => {
        return () => {
            newImagePreviews.forEach(preview => revokeImagePreview(preview));
        };
    }, [newImagePreviews]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{initialData ? 'Edit Impact Evidence' : 'Submit Impact Evidence'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Food Distribution Day 1"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what was accomplished..."
                            className="min-h-[100px]"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Evidence Photos</label>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {/* Existing Images */}
                            {existingImages.map((url, index) => (
                                <div key={`existing-${index}`} className="relative group aspect-square">
                                    <img
                                        src={url}
                                        alt={`Evidence ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemoveExistingImage(index)}
                                        disabled={loading}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}

                            {/* New Image Previews */}
                            {newImagePreviews.map((preview, index) => (
                                <div key={`new-${index}`} className="relative group aspect-square">
                                    <img
                                        src={preview}
                                        alt={`New upload ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemoveNewImage(index)}
                                        disabled={loading}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}

                            {/* Upload Button */}
                            <div className="aspect-square">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="evidence-image-upload"
                                    disabled={loading}
                                />
                                <label
                                    htmlFor="evidence-image-upload"
                                    className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Plus className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-500">Add Image</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={loading || (existingImages.length === 0 && newImageFiles.length === 0)}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {uploading ? 'Uploading...' : 'Saving...'}
                                </>
                            ) : (
                                initialData ? 'Update Evidence' : 'Submit Evidence'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
