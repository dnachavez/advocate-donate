import { useState, useEffect, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ArrowLeft, MapPin, Verified, CreditCard, CheckCircle, AlertCircle, Loader2, User } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import organizationImage from "@/assets/organization-relief.jpg";
import { donationService, DonationFormState, DonationContext } from "../lib/donationService";
import { MockPaymentMethod } from "../lib/payment";
import DonationConfirmation from "../components/DonationConfirmation";
import { useAuth } from "@/contexts/AuthContext";
import { organizationService, OrganizationWithCampaigns } from "@/lib/organizationService";

const DonateOrganization = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [org, setOrg] = useState<OrganizationWithCampaigns | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAmount, setSelectedAmount] = useState("");
  const [donationType, setDonationType] = useState("one-time");
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [formState, setFormState] = useState<DonationFormState>(donationService.initializeFormState());
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<MockPaymentMethod[]>([]);
  const [donationResult, setDonationResult] = useState<{ success: boolean; donationId?: string; error?: string } | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const { user } = useAuth();

  const loadOrganization = useCallback(async () => {
    if (!slug) {
      setError("Organization slug is required");
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await organizationService.getOrganizationBySlug(slug);
      
      if (fetchError) {
        setError(fetchError);
      } else if (!data) {
        setError("Organization not found");
      } else {
        setOrg(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organization");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    setAvailablePaymentMethods(donationService.getAvailablePaymentMethods());
    initializeFormWithAuth();
    loadOrganization();
  }, [slug, loadOrganization]);

  const initializeFormWithAuth = async () => {
    setIsLoadingUserData(true);
    try {
      const initialState = await donationService.initializeFormStateWithAuth();
      setFormState(initialState);
    } catch (error) {
      console.error('Error initializing form with auth:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const suggestedAmounts = [250, 500, 1000, 2500, 5000, 10000];

  const handleDonate = () => {
    const amount = parseFloat(selectedAmount);
    if (amount && org) {
      setFormState(prev => ({
        ...prev,
        amount: amount,
        isRecurring: donationType === "monthly",
        frequency: donationType === "monthly" ? "monthly" : "yearly"
      }));
      setShowDonationForm(true);
    }
  };

  const handleFormChange = (field: string, value: string | number | boolean | MockPaymentMethod) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      errors: {
        ...prev.errors,
        [field]: ''
      }
    }));
  };

  const handlePaymentMethodSelect = (method: MockPaymentMethod) => {
    handleFormChange('selectedPaymentMethod', method);
  };

  const handleSubmitDonation = async () => {
    if (!org) return;

    setFormState(prev => ({ ...prev, isProcessing: true }));

    try {
      const context = {
        organizationId: org.id,
        organizationName: org.name
      };

      const result = await donationService.processDonation(formState, context);
      setDonationResult(result);
    } catch (error) {
      setDonationResult({
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setFormState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const resetDonationFlow = () => {
    setShowDonationForm(false);
    setDonationResult(null);
    setFormState(donationService.initializeFormState());
    setSelectedAmount("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading organization...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold mb-2">Organization Not Found</h1>
            <p className="text-muted-foreground mb-4">
              {error || "The organization you are trying to donate to does not exist."}
            </p>
            <Link to="/organizations">
              <Button variant="default">Browse Organizations</Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <section className="py-8 px-4 bg-muted/30 border-b border-border">
          <div className="max-w-5xl mx-auto">
            <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="flex items-center gap-4">
              <img 
                src={org.banner_url || org.logo_url || organizationImage} 
                alt={org.name} 
                className="w-16 h-16 rounded-md object-cover" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">Donate to {org.name}</h1>
                  {org.verification_status === 'verified' && (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <Verified className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-white/90 text-foreground">{org.category}</Badge>
                </div>
                <div className="text-sm text-muted-foreground flex items-center mt-1">
                  <MapPin className="w-3 h-3 mr-1" /> 
                  {[org.city, org.state, org.country].filter(Boolean).join(', ') || 'Location not specified'}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Complete Your Donation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center gap-4">
                  <Button
                    variant={donationType === "one-time" ? "default" : "outline"}
                    onClick={() => setDonationType("one-time")}
                  >
                    One-Time
                  </Button>
                  <Button
                    variant={donationType === "monthly" ? "default" : "outline"}
                    onClick={() => setDonationType("monthly")}
                  >
                    Monthly
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-center mb-4">Choose Amount</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {suggestedAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount.toString() ? "default" : "outline"}
                        onClick={() => setSelectedAmount(amount.toString())}
                        className="h-12"
                      >
                        ₱{amount}
                      </Button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₱</span>
                    <Input
                      placeholder="Custom amount"
                      value={selectedAmount}
                      onChange={(e) => setSelectedAmount(e.target.value)}
                      className="pl-8"
                      type="number"
                      min={1}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  disabled={!selectedAmount}
                  onClick={handleDonate}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {donationType === "monthly" ? "Start Monthly Giving" : "Donate Now"}
                </Button>

                {/* Donation Form Modal */}
                {showDonationForm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-semibold">Complete Your Donation</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDonationForm(false)}
                          >
                            ×
                          </Button>
                        </div>

                        {donationResult ? (
                          <div className="text-center py-8">
                            <DonationConfirmation
                              result={{
                                success: donationResult.success,
                                donationId: donationResult.donationId,
                                error: donationResult.error,
                                amount: formState.amount,
                                recipient: org.name
                              }}
                              onClose={() => setShowDonationForm(false)}
                              onNewDonation={resetDonationFlow}
                              recipientType="organization"
                              recipientId={org.slug}
                            />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Donation Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-2">Donation Summary</h4>
                              <div className="flex justify-between">
                                <span>Amount:</span>
                                <span className="font-semibold">₱{formState.amount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Type:</span>
                                <span>{formState.isRecurring ? 'Monthly' : 'One-time'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Organization:</span>
                                <span className="text-sm">{org.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Category:</span>
                                <span className="text-sm">{org.category}</span>
                              </div>
                            </div>

                            {/* Authenticated User Information */}
                            <div className="space-y-3">
                              <div className="bg-muted/50 p-4 rounded-lg border">
                                <div className="flex items-center gap-2 mb-3">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <Label className="text-sm font-medium">Donation will be made by:</Label>
                                </div>
                                {isLoadingUserData ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">Loading your information...</span>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-muted-foreground">Name:</span>
                                      <span className="text-sm font-medium">{formState.donorName || 'Not provided'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm text-muted-foreground">Email:</span>
                                      <span className="text-sm font-medium">{formState.donorEmail || 'Not provided'}</span>
                                    </div>
                                    {formState.donorPhone && (
                                      <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Phone:</span>
                                        <span className="text-sm font-medium">{formState.donorPhone}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div>
                                <Label htmlFor="message">Message (Optional)</Label>
                                <Textarea
                                  id="message"
                                  value={formState.message}
                                  onChange={(e) => handleFormChange('message', e.target.value)}
                                  placeholder="Leave a message with your donation"
                                  rows={3}
                                />
                              </div>
                            </div>

                            {/* Payment Methods */}
                            <div>
                              <Label>Payment Method *</Label>
                              <div className="grid grid-cols-1 gap-2 mt-2">
                                {availablePaymentMethods.map((method) => (
                                  <div
                                    key={method.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                      formState.selectedPaymentMethod?.id === method.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => handlePaymentMethodSelect(method)}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <CreditCard className="w-5 h-5" />
                                      <div>
                                        <p className="font-medium">{method.type.toUpperCase()}</p>
                                        <p className="text-sm text-gray-600">**** **** **** {method.card.last4}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {formState.errors.selectedPaymentMethod && (
                                <p className="text-red-500 text-sm mt-1">{formState.errors.selectedPaymentMethod}</p>
                              )}
                            </div>

                            {/* Anonymous Donation */}
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="anonymous"
                                checked={formState.isAnonymous}
                                onCheckedChange={(checked) => handleFormChange('isAnonymous', checked)}
                              />
                              <Label htmlFor="anonymous" className="text-sm">
                                Make this donation anonymous
                              </Label>
                            </div>

                            {/* Submit Button */}
                            <Button
                              onClick={handleSubmitDonation}
                              disabled={formState.isProcessing}
                              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                            >
                              {formState.isProcessing ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                `Donate ₱${formState.amount}`
                              )}
                            </Button>

                            {/* Error Display */}
                            {Object.values(formState.errors).some(error => error) && (
                              <Alert className="border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700">
                                  Please fix the errors above before proceeding.
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-muted-foreground text-center">
                  Your donation is secure and you'll receive a receipt for tax purposes.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DonateOrganization;
