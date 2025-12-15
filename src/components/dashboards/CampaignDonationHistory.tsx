import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Calendar, User, MessageSquare } from "lucide-react";
import { donationService, type DonationHistory } from "@/lib/donationService";
import { format } from "date-fns";

interface CampaignDonationHistoryProps {
  campaignId: string;
  campaignTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignDonationHistory({
  campaignId,
  campaignTitle,
  open,
  onOpenChange
}: CampaignDonationHistoryProps) {
  const [donations, setDonations] = useState<DonationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (open && campaignId) {
      loadDonations();
    }
  }, [open, campaignId]);

  const loadDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await donationService.getCampaignDonations(campaignId);
      if (result.error) {
        setError(result.error);
      } else {
        setDonations(result.donations);
        setTotal(result.total);
      }
    } catch (err) {
      setError("Failed to load donation history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Donation History</DialogTitle>
          <DialogDescription>
            Viewing donations for campaign: <span className="font-medium text-foreground">{campaignTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Loading donations...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadDonations}>
                Try Again
              </Button>
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-muted/20">
              <DollarSign className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No donations yet</h3>
              <p className="text-muted-foreground">This campaign hasn't received any donations yet.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Total Donations: <span className="font-medium text-foreground">{total}</span>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
                            {format(new Date(donation.created_at), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-2 text-muted-foreground" />
                            {donation.is_anonymous ? 'Anonymous' : 'Donor'}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(donation.amount, donation.currency)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={donation.message || ''}>
                          {donation.message ? (
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-2 text-muted-foreground" />
                              {donation.message}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">No message</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
