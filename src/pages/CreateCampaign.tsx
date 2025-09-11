import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Target, Calendar, DollarSign, Image as ImageIcon, Upload, X, Loader2, AlertCircle } from "lucide-react";
import { organizationService } from '@/lib/organizationService';
import { campaignService } from '@/lib/campaignService';
import { uploadImage, validateImageFile, createImagePreview, revokeImagePreview } from '@/lib/imageUpload';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

interface CampaignForm {
  title: string;
  category: string;
  short_description: string;
  description: string;
  fund_usage: string;
  goal_amount: string;
  currency: string;
  end_date: string;
  featured_image_url: string;
}

const CreateCampaign: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Tables<'organizations'> | null>(null);
  const [formData, setFormData] = useState<CampaignForm>({
    title: '',
    category: '',
    short_description: '',
    description: '',
    fund_usage: '',
    goal_amount: '',
    currency: 'PHP',
    end_date: '',
    featured_image_url: ''
  });
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<CampaignForm>>({});

  const categories = [
    "Food & Nutrition",
    "Healthcare",
    "Education",
    "Disaster Relief",
    "Housing & Shelter",
    "Clean Water",
    "Children & Youth",
    "Elderly Care",
    "Environment",
    "Community Development"
  ];

  // Check if user has an organization on component mount
  useEffect(() => {
    const checkOrganization = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const { data: org, error } = await organizationService.getCurrentUserOrganization();
        
        if (error || !org) {
          setError('You need to set up an organization before creating campaigns.');
          return;
        }
        
        setOrganization(org);
      } catch (err) {
        console.error('Error checking organization:', err);
        setError('Failed to load organization details');
      } finally {
        setInitialLoading(false);
      }
    };

    checkOrganization();
  }, [user, navigate]);

  // Handle image file selection
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
    
    // Clean up previous preview
    if (imagePreview && !formData.featured_image_url) {
      revokeImagePreview(imagePreview);
    }
    
    const preview = createImagePreview(file);
    setImagePreview(preview);
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview && !formData.featured_image_url) {
      revokeImagePreview(imagePreview);
    }
    setImagePreview('');
    setFormData(prev => ({ ...prev, featured_image_url: '' }));
  };

  // Upload image to blob storage
  const uploadCampaignImage = async (): Promise<string> => {
    if (!imageFile) return formData.featured_image_url;
    
    setUploadingImage(true);
    try {
      // Update filename prefix for campaigns
      const result = await uploadImage(imageFile);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.url;
    } finally {
      setUploadingImage(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<CampaignForm> = {};

    if (!formData.title.trim()) errors.title = 'Campaign title is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.short_description.trim()) errors.short_description = 'Short description is required';
    if (!formData.description.trim()) errors.description = 'Campaign story is required';
    if (!formData.fund_usage.trim()) errors.fund_usage = 'Fund usage explanation is required';
    if (!formData.goal_amount || parseFloat(formData.goal_amount) <= 0) {
      errors.goal_amount = 'Valid goal amount is required';
    }
    if (!formData.end_date) errors.end_date = 'End date is required';
    
    // Check if end date is in the future
    if (formData.end_date && new Date(formData.end_date) <= new Date()) {
      errors.end_date = 'End date must be in the future';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!organization) {
      setError('Organization not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload image if selected
      const imageUrl = await uploadCampaignImage();

      // Generate unique slug
      const baseSlug = campaignService.generateSlug(formData.title);
      const { available, error: slugError } = await campaignService.isSlugAvailable(baseSlug);
      
      if (slugError) {
        throw new Error('Failed to validate campaign title');
      }

      const finalSlug = available ? baseSlug : `${baseSlug}-${Date.now()}`;

      // Create campaign data
      const campaignData = {
        organization_id: organization.id,
        slug: finalSlug,
        title: formData.title.trim(),
        description: formData.description.trim(),
        short_description: formData.short_description.trim(),
        fund_usage_description: formData.fund_usage.trim(),
        goal_amount: parseFloat(formData.goal_amount),
        currency: formData.currency,
        end_date: formData.end_date,
        category: formData.category,
        featured_image_url: imageUrl || null,
        status: 'active' as const,
        is_featured: false,
        is_urgent: false
      };

      const { data: campaign, error: createError } = await campaignService.createCampaign(campaignData);
      
      if (createError || !campaign) {
        throw new Error(createError || 'Failed to create campaign');
      }

      toast({
        title: 'Campaign Created Successfully!',
        description: 'Your campaign is now live and accepting donations.',
      });

      // Redirect to the new campaign page
      navigate(`/campaigns/${campaign.slug}`);

    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !organization) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 px-4">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button onClick={() => navigate('/organization-setup')}>
                Set Up Organization
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Heart className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Create Campaign
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Launch a fundraising campaign to support your cause and connect with generous donors in your community.
            </p>
          </div>
        </section>

        {/* Campaign Form */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Campaign Title *
                    </label>
                    <Input 
                      placeholder="Enter a compelling campaign title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={formErrors.title ? 'border-red-500' : ''}
                    />
                    {formErrors.title && <p className="text-sm text-red-600 mt-1">{formErrors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category *
                    </label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select campaign category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && <p className="text-sm text-red-600 mt-1">{formErrors.category}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Short Description *
                    </label>
                    <Input 
                      placeholder="Brief description that will appear in search results"
                      value={formData.short_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                      className={formErrors.short_description ? 'border-red-500' : ''}
                    />
                    {formErrors.short_description && <p className="text-sm text-red-600 mt-1">{formErrors.short_description}</p>}
                  </div>
                </div>

                {/* Campaign Story */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Campaign Story</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tell Your Story *
                    </label>
                    <Textarea 
                      placeholder="Share the compelling story behind your campaign. Explain the problem, your solution, and the impact donations will make."
                      className={`min-h-[120px] ${formErrors.description ? 'border-red-500' : ''}`}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                    {formErrors.description && <p className="text-sm text-red-600 mt-1">{formErrors.description}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      How Funds Will Be Used *
                    </label>
                    <Textarea 
                      placeholder="Be specific about how donations will be allocated. Transparency builds trust with donors."
                      className={`min-h-[80px] ${formErrors.fund_usage ? 'border-red-500' : ''}`}
                      value={formData.fund_usage}
                      onChange={(e) => setFormData(prev => ({ ...prev, fund_usage: e.target.value }))}
                    />
                    {formErrors.fund_usage && <p className="text-sm text-red-600 mt-1">{formErrors.fund_usage}</p>}
                  </div>
                </div>

                {/* Financial Goals */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Financial Goals
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Fundraising Goal *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="50000" 
                          className={`pl-10 ${formErrors.goal_amount ? 'border-red-500' : ''}`}
                          type="number" 
                          value={formData.goal_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, goal_amount: e.target.value }))}
                        />
                      </div>
                      {formErrors.goal_amount && <p className="text-sm text-red-600 mt-1">{formErrors.goal_amount}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Currency
                      </label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PHP">PHP (Philippine Peso)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Campaign End Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="date" 
                        className={`pl-10 ${formErrors.end_date ? 'border-red-500' : ''}`}
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                    {formErrors.end_date && <p className="text-sm text-red-600 mt-1">{formErrors.end_date}</p>}
                  </div>
                </div>

                {/* Media Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Campaign Media
                  </h3>
                  
                  <div className="space-y-4">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Campaign image preview"
                          className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                          onClick={handleRemoveImage}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-foreground mb-2">Upload Campaign Image</h4>
                        <p className="text-muted-foreground mb-4">
                          Add a compelling photo that tells your story. High-quality images increase donor engagement.
                        </p>
                        <p className="text-xs text-gray-500 mb-4">PNG, JPG, GIF up to 2MB</p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="campaign-image-upload"
                    />
                    
                    {!imagePreview && (
                      <label htmlFor="campaign-image-upload">
                        <Button type="button" variant="outline" className="w-full" asChild>
                          <span className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Image
                          </span>
                        </Button>
                      </label>
                    )}
                  </div>
                </div>

                {/* Preview Section */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold text-foreground">Preview</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Campaign Preview</p>
                    <div className="bg-card p-4 rounded border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{formData.category || 'Category'}</Badge>
                      </div>
                      <h4 className="font-semibold text-foreground mb-2">{formData.title || 'Your Campaign Title'}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{formData.short_description || 'Your short description will appear here...'}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formData.currency === 'USD' ? '$' : '₱'}0 raised of {formData.currency === 'USD' ? '$' : '₱'}{formData.goal_amount || '0'} goal
                        </span>
                        <span className="text-muted-foreground">
                          {formData.end_date ? Math.ceil((new Date(formData.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : '0'} days left
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="border-t pt-6">
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex items-center gap-2 mb-4">
                    <input type="checkbox" id="terms" className="rounded border-border" />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and confirm that all information is accurate.
                    </label>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      disabled={loading || uploadingImage}
                    >
                      Save as Draft
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleSubmit}
                      disabled={loading || uploadingImage}
                    >
                      {loading || uploadingImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {uploadingImage ? 'Uploading...' : 'Creating...'}
                        </>
                      ) : (
                        'Launch Campaign'
                      )}
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CreateCampaign;