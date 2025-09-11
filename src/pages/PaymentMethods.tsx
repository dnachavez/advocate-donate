import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit, 
  Lock, 
  ArrowLeft, 
  Loader2,
  AlertTriangle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { paymentMethodService, PaymentMethodDB } from '@/lib/paymentMethodService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'digital_wallet';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  nickname?: string;
  funding?: string;
  bankName?: string;
  bankAccountType?: string;
  lastUsedAt?: string;
  createdAt: string;
}

const PaymentMethods: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingMethod, setAddingMethod] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [billingAddress, setBillingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US'
  });

  // Helper function to convert database payment method to component interface
  const convertDBPaymentMethod = (dbMethod: PaymentMethodDB): PaymentMethod => {
    return {
      id: dbMethod.id,
      type: dbMethod.type,
      last4: dbMethod.card_last4 || dbMethod.bank_account_last4 || '',
      brand: dbMethod.card_brand,
      expiryMonth: dbMethod.card_exp_month,
      expiryYear: dbMethod.card_exp_year,
      isDefault: dbMethod.is_default,
      nickname: dbMethod.nickname,
      funding: dbMethod.card_funding,
      bankName: dbMethod.bank_name,
      bankAccountType: dbMethod.bank_account_type,
      lastUsedAt: dbMethod.last_used_at,
      createdAt: dbMethod.created_at
    };
  };

  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await paymentMethodService.getUserPaymentMethods();
        
        if (error) {
          console.error('Error loading payment methods:', error);
          toast({
            title: "Error",
            description: error,
            variant: "destructive"
          });
          return;
        }

        if (data) {
          const convertedMethods = data.map(convertDBPaymentMethod);
          setPaymentMethods(convertedMethods);
          
          // Load billing address from default payment method if available
          const defaultMethod = data.find(method => method.is_default);
          if (defaultMethod && defaultMethod.billing_address) {
            setBillingAddress(defaultMethod.billing_address);
          }
        } else {
          setPaymentMethods([]);
        }
      } catch (error) {
        console.error('Error loading payment methods:', error);
        toast({
          title: "Error",
          description: "Failed to load payment methods",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPaymentMethods();
  }, [user, toast]);

  const handleSetDefault = async (id: string) => {
    try {
      const { success, error } = await paymentMethodService.setDefaultPaymentMethod(id);
      
      if (error) {
        console.error('Error setting default payment method:', error);
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      if (success) {
        // Update local state
        setPaymentMethods(prev => prev.map(method => ({
          ...method,
          isDefault: method.id === id
        })));

        toast({
          title: "Success",
          description: "Default payment method updated",
        });
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast({
        title: "Error",
        description: "Failed to update default payment method",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMethod = async (id: string) => {
    try {
      const { success, error } = await paymentMethodService.removePaymentMethod(id);
      
      if (error) {
        console.error('Error removing payment method:', error);
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      if (success) {
        // Remove from local state
        setPaymentMethods(prev => prev.filter(method => method.id !== id));

        toast({
          title: "Success",
          description: "Payment method removed",
        });
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive"
      });
    }
  };

  const handleAddMethod = async () => {
    setAddingMethod(true);
    try {
      // Note: In a real implementation, this would integrate with a payment processor like Stripe
      // to securely tokenize the card details before storing in the database
      // For now, we'll show a placeholder implementation
      
      toast({
        title: "Feature Coming Soon",
        description: "Payment method integration with Stripe is currently in development. This feature will be available soon.",
        variant: "default"
      });
      
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive"
      });
    } finally {
      setAddingMethod(false);
    }
  };

  const handleSaveBillingAddress = async () => {
    setSavingBilling(true);
    try {
      // Find default payment method to update, or create new one if none exists
      const defaultMethod = paymentMethods.find(method => method.isDefault);
      
      if (defaultMethod) {
        const { data, error } = await paymentMethodService.updatePaymentMethod(defaultMethod.id, {
          billing_address: billingAddress
        });
        
        if (error) {
          console.error('Error updating billing address:', error);
          toast({
            title: "Error",
            description: error,
            variant: "destructive"
          });
          return;
        }

        if (data) {
          // Update local state
          setPaymentMethods(prev => prev.map(method => 
            method.id === defaultMethod.id 
              ? { ...method, ...convertDBPaymentMethod(data) }
              : method
          ));
        }
      }
      
      setShowBillingDialog(false);
      toast({
        title: "Success",
        description: "Billing address updated successfully",
      });
    } catch (error) {
      console.error('Error saving billing address:', error);
      toast({
        title: "Error",
        description: "Failed to save billing address",
        variant: "destructive"
      });
    } finally {
      setSavingBilling(false);
    }
  };

  const handleBillingAddressChange = (field: string, value: string) => {
    setBillingAddress(prev => ({ ...prev, [field]: value }));
  };

  const getCardIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading payment methods...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button asChild variant="ghost" className="mb-4">
              <Link to="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
            <p className="text-gray-600 mt-2">
              Manage your saved payment methods for quick and secure donations
            </p>
          </div>

          {/* Security Notice */}
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Secure Payment Processing</h3>
                  <p className="text-sm text-blue-700">
                    Your payment information is encrypted and processed securely. We never store your complete card details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods List */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Saved Payment Methods
              </CardTitle>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Payment Method
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Payment Method</DialogTitle>
                    <DialogDescription>
                      Add a new payment method for future donations
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input
                        id="card-number"
                        placeholder="1234 5678 9012 3456"
                        className="text-lg tracking-wider"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="expiry-month">Month</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="MM" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                {String(i + 1).padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="expiry-year">Year</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="YYYY" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => (
                              <SelectItem key={i} value={String(2024 + i)}>
                                {2024 + i}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input
                          id="cvc"
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nickname">Nickname (Optional)</Label>
                      <Input
                        id="nickname"
                        placeholder="My Personal Card"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddMethod}
                      disabled={addingMethod}
                    >
                      {addingMethod ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Payment Method'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
                  <p className="text-gray-500 mb-4">Add a payment method to make donations easier</p>
                  <Button 
                    onClick={() => setShowAddDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Payment Method
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">
                          {getCardIcon(method.brand)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              •••• •••• •••• {method.last4}
                            </span>
                            {method.brand && (
                              <Badge variant="secondary" className="capitalize">
                                {method.brand}
                              </Badge>
                            )}
                            {method.isDefault && (
                              <Badge className="bg-green-100 text-green-800">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {method.nickname && `${method.nickname} • `}
                            {method.expiryMonth && method.expiryYear && 
                              `Expires ${method.expiryMonth.toString().padStart(2, '0')}/${method.expiryYear}`
                            }
                            {method.lastUsedAt && (
                              <span className="ml-2">• Last used {new Date(method.lastUsedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                          >
                            Set as Default
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Remove Payment Method
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove this payment method? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMethod(method.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Tax Receipts</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    All donations are eligible for tax receipts. Receipts will be sent to your email address.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowBillingDialog(true)}
                  >
                    {billingAddress.line1 ? 'Update' : 'Add'} Billing Address
                  </Button>
                  {billingAddress.line1 && (
                    <div className="mt-3 p-3 bg-white border rounded text-sm">
                      <div className="font-medium text-gray-900">Current Billing Address</div>
                      <div className="text-gray-600 mt-1">
                        <div>{billingAddress.line1}</div>
                        {billingAddress.line2 && <div>{billingAddress.line2}</div>}
                        <div>{billingAddress.city}, {billingAddress.state} {billingAddress.postal_code}</div>
                        <div>{billingAddress.country}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Automatic Receipts</h4>
                  <p className="text-sm text-yellow-700">
                    Tax receipts are automatically generated and emailed to you within 24 hours of each donation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address Dialog */}
          <Dialog open={showBillingDialog} onOpenChange={setShowBillingDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Update Billing Address</DialogTitle>
                <DialogDescription>
                  Update your billing address for tax receipts and payment processing
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="address-line1">Address Line 1 *</Label>
                  <Input
                    id="address-line1"
                    placeholder="123 Main Street"
                    value={billingAddress.line1}
                    onChange={(e) => handleBillingAddressChange('line1', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address-line2">Address Line 2</Label>
                  <Input
                    id="address-line2"
                    placeholder="Apt 4B, Suite 100 (optional)"
                    value={billingAddress.line2}
                    onChange={(e) => handleBillingAddressChange('line2', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={billingAddress.city}
                      onChange={(e) => handleBillingAddressChange('city', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={billingAddress.state}
                      onChange={(e) => handleBillingAddressChange('state', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="postal-code">Postal Code *</Label>
                    <Input
                      id="postal-code"
                      placeholder="10001"
                      value={billingAddress.postal_code}
                      onChange={(e) => handleBillingAddressChange('postal_code', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={billingAddress.country}
                      onValueChange={(value) => handleBillingAddressChange('country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="JP">Japan</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBillingDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveBillingAddress}
                  disabled={savingBilling || !billingAddress.line1 || !billingAddress.city || !billingAddress.state || !billingAddress.postal_code}
                >
                  {savingBilling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Address'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
