import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, CheckCircle, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { userService } from '@/lib/userService';
import { organizationService } from '@/lib/organizationService';
import { toast } from '@/hooks/use-toast';

interface OrganizationSetupForm {
  name: string;
  description: string;
  mission_statement: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  category: string;
  subcategories: string;
  registration_number: string;
  tax_id: string;
  founded_year: string;
}

const organizationCategories = [
  'Education',
  'Healthcare',
  'Environment',
  'Social Services',
  'Arts & Culture',
  'Animal Welfare',
  'Community Development',
  'Disaster Relief',
  'Human Rights',
  'Youth Development',
  'Senior Services',
  'Religious',
  'Other'
];

const OrganizationSetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OrganizationSetupForm>({
    name: '',
    description: '',
    mission_statement: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    category: '',
    subcategories: '',
    registration_number: '',
    tax_id: '',
    founded_year: ''
  });
  const [errors, setErrors] = useState<Partial<OrganizationSetupForm>>({});

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        const { data: profile, error } = await userService.getCurrentUserProfile();
        
        if (error) {
          setError('Failed to load user profile');
          return;
        }

        if (!profile) {
          setError('User profile not found');
          return;
        }

        if (profile.user_type !== 'nonprofit') {
          navigate('/dashboard');
          return;
        }

        if (profile.organization) {
          // Organization already exists, redirect to dashboard
          navigate('/dashboard');
          return;
        }

        // Pre-populate form with existing profile data
        setFormData(prev => ({
          ...prev,
          name: profile.organization_name || '',
          email: user?.email || '',
          registration_number: profile.registration_number || '',
          website: profile.website || '',
        }));

      } catch (err) {
        console.error('Error checking user access:', err);
        setError('An error occurred while loading the page');
      } finally {
        setInitialLoading(false);
      }
    };

    checkUserAccess();
  }, [user, navigate]);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Partial<OrganizationSetupForm> = {};

    switch (stepNumber) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Organization name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
      case 2:
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        break;
      case 3:
        if (!formData.registration_number.trim()) newErrors.registration_number = 'Registration number is required';
        if (formData.founded_year && (isNaN(Number(formData.founded_year)) || Number(formData.founded_year) < 1900 || Number(formData.founded_year) > new Date().getFullYear())) {
          newErrors.founded_year = 'Please enter a valid year';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    setError(null);

    try {
      // Generate slug from organization name
      const baseSlug = organizationService.generateSlug(formData.name);
      
      // Check if slug is available
      const { available, error: slugError } = await organizationService.isSlugAvailable(baseSlug);
      
      if (slugError) {
        throw new Error('Failed to validate organization name');
      }

      const finalSlug = available ? baseSlug : `${baseSlug}-${Date.now()}`;

      // Create organization
      const organizationData = {
        user_id: user!.id,
        slug: finalSlug,
        name: formData.name.trim(),
        description: formData.description.trim(),
        mission_statement: formData.mission_statement.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postal_code: formData.postal_code.trim() || null,
        category: formData.category,
        subcategories: formData.subcategories ? formData.subcategories.split(',').map(s => s.trim()) : [],
        registration_number: formData.registration_number.trim(),
        tax_id: formData.tax_id.trim() || null,
        founded_year: formData.founded_year ? Number(formData.founded_year) : null,
        country: 'Philippines'
      };

      const { data, error: createError } = await organizationService.createOrganization(organizationData);

      if (createError) {
        throw new Error(createError);
      }

      if (!data) {
        throw new Error('Failed to create organization');
      }

      toast({
        title: 'Organization Created Successfully!',
        description: 'Your organization profile has been created. It will be reviewed for verification.',
      });

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error('Error creating organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading organization setup...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Setup Error
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-red-600">{error}</p>
                <Link to="/dashboard">
                  <Button className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Go to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your organization name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select organization category" />
                </SelectTrigger>
                <SelectContent>
                  {organizationCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what your organization does"
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mission Statement</label>
              <Textarea
                value={formData.mission_statement}
                onChange={(e) => setFormData(prev => ({ ...prev, mission_statement: e.target.value }))}
                placeholder="Your organization's mission and goals"
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Organization email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Organization phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <Input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourorganization.org"
              />
            </div>

            <Separator />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State/Province *</label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State or Province"
                  className={errors.state ? 'border-red-500' : ''}
                />
                {errors.state && <p className="text-sm text-red-600 mt-1">{errors.state}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
              <Input
                value={formData.postal_code}
                onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                placeholder="Postal code"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number *</label>
              <Input
                value={formData.registration_number}
                onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                placeholder="Government registration number"
                className={errors.registration_number ? 'border-red-500' : ''}
              />
              {errors.registration_number && <p className="text-sm text-red-600 mt-1">{errors.registration_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
              <Input
                value={formData.tax_id}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
                placeholder="Tax identification number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Founded Year</label>
              <Input
                type="number"
                value={formData.founded_year}
                onChange={(e) => setFormData(prev => ({ ...prev, founded_year: e.target.value }))}
                placeholder="Year your organization was founded"
                min="1900"
                max={new Date().getFullYear()}
                className={errors.founded_year ? 'border-red-500' : ''}
              />
              {errors.founded_year && <p className="text-sm text-red-600 mt-1">{errors.founded_year}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategories</label>
              <Input
                value={formData.subcategories}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategories: e.target.value }))}
                placeholder="Specific areas of focus (comma-separated)"
              />
              <p className="text-sm text-gray-500 mt-1">
                E.g., "Education for children, Adult literacy, STEM programs"
              </p>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                After submitting, your organization will be reviewed for verification. This process typically takes 1-3 business days.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">Organization Setup</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Organization Profile</h1>
            <p className="text-gray-600">
              Set up your organization to start creating campaigns and receiving donations
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber <= step 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNumber < step ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                  </div>
                  <span className={`ml-2 text-sm ${
                    stepNumber <= step ? 'text-primary font-medium' : 'text-gray-500'
                  }`}>
                    {stepNumber === 1 && 'Basic Info'}
                    {stepNumber === 2 && 'Contact & Location'}
                    {stepNumber === 3 && 'Legal & Verification'}
                  </span>
                </div>
                {stepNumber < 3 && (
                  <div className={`mx-4 h-0.5 w-12 ${
                    stepNumber < step ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Setup Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                Step {step}: {step === 1 && 'Basic Information'}
                {step === 2 && 'Contact & Location'}
                {step === 3 && 'Legal & Verification'}
              </CardTitle>
              <CardDescription>
                {step === 1 && 'Tell us about your organization and its mission'}
                {step === 2 && 'Provide contact information and address'}
                {step === 3 && 'Complete legal information for verification'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <div>
                  {step > 1 && (
                    <Button variant="outline" onClick={handleBack}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  )}
                </div>

                <div>
                  {step < 3 ? (
                    <Button onClick={handleNext}>
                      Next
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Organization...
                        </>
                      ) : (
                        'Complete Setup'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Need help? <Link to="/support" className="text-primary hover:underline">Contact Support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSetup;
