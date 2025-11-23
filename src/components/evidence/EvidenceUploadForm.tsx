import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { uploadImage, validateImageFile, createImagePreview, revokeImagePreview } from '@/lib/imageUpload';
import { evidenceService } from '@/services/evidenceService';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface EvidenceUploadFormProps {
    targetType: 'campaign' | 'organization';
    targetId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const EvidenceUploadForm: React.FC<EvidenceUploadFormProps> = ({
    targetType,
    targetId,
    onSuccess,
    onCancel
}) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.isValid) {
            toast({
                title: 'Invalid file',
                description: validation.error,
                variant: 'destructive',
            });
            return;
        }

        setImageFile(file);

        if (imagePreview) {
            revokeImagePreview(imagePreview);
        }

        const preview = createImagePreview(file);
        setImagePreview(preview);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        if (imagePreview) {
            revokeImagePreview(imagePreview);
        }
        setImagePreview('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!title.trim() || !description.trim() || !imageFile) {
            toast({
                title: 'Missing information',
                description: 'Please provide a title, description, and an image.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            console.log('Starting evidence submission...');
            setUploading(true);

            console.log('Uploading image...');
            const result = await uploadImage(imageFile);
            console.log('Upload result:', result);

            setUploading(false);

            if (result.error) throw new Error(result.error);
            if (!result.url) throw new Error('Failed to upload image - no URL returned');

            console.log('Submitting evidence data to Supabase...');
            await evidenceService.submitEvidence({
                target_type: targetType,
                target_id: targetId,
                title: title.trim(),
                description: description.trim(),
                media_urls: [result.url],
                created_by: user.id
            });
            console.log('Evidence submitted successfully');

            toast({
                title: 'Evidence submitted',
                description: 'Your impact evidence has been successfully submitted.',
            });

            // Reset form
            setTitle('');
            setDescription('');
            handleRemoveImage();

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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit Impact Evidence</CardTitle>
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
                        <label className="block text-sm font-medium mb-2">Evidence Photo</label>
                        {imagePreview ? (
                            <div className="relative inline-block">
                                <img
                                    src={imagePreview}
                                    alt="Evidence preview"
                                    className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                                    onClick={handleRemoveImage}
                                    disabled={loading}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground mb-4">
                                    Upload a photo as proof of impact
                                </p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="evidence-image-upload"
                                    disabled={loading}
                                />
                                <label htmlFor="evidence-image-upload">
                                    <Button type="button" variant="outline" asChild disabled={loading}>
                                        <span className="cursor-pointer">
                                            <Upload className="w-4 h-4 mr-2" />
                                            Choose Image
                                        </span>
                                    </Button>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={loading || !imageFile}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {uploading ? 'Uploading...' : 'Submitting...'}
                                </>
                            ) : (
                                'Submit Evidence'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
