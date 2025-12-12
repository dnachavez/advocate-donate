import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TierBadge } from '@/components/ui/UserBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Trophy,
  Star,
  Share2,
  X,
  ExternalLink,
  Sparkles,
  ArrowUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TierName } from '@/types/gamification';

interface TierUpgradeNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  fromTier: TierName;
  toTier: TierName;
  newBadgeColor: string;
  newBadgeIcon: string;
  totalAmountAtUpgrade: number;
  onViewAchievements?: () => void;
  onShare?: () => void;
}

const TierUpgradeNotification: React.FC<TierUpgradeNotificationProps> = ({
  isOpen,
  onClose,
  fromTier,
  toTier,
  newBadgeColor,
  newBadgeIcon,
  totalAmountAtUpgrade,
  onViewAchievements,
  onShare
}) => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  // Format tier names for display
  const formatTierName = (tierName: string) => {
    return tierName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get upgrade message based on tier
  const getUpgradeMessage = (tier: TierName) => {
    const messages = {
      bronze: "You've taken your first big step in making a difference! Your generosity is already having an impact.",
      silver: "Your commitment to giving back shines bright! You're becoming a pillar of our community.",
      gold: "Incredible dedication! Your golden heart is changing lives and inspiring others to give.",
      platinum: "You've reached the pinnacle of generosity! Your extraordinary impact will be felt for generations.",
      new_donor: "Welcome to our community of changemakers!"
    };
    return messages[tier] || "Congratulations on your achievement!";
  };

  // Get tier benefits/perks message
  const getTierBenefits = (tier: TierName) => {
    const benefits = {
      bronze: "• Priority support • Monthly impact reports • Bronze supporter recognition",
      silver: "• All Bronze benefits • Exclusive donor events • Silver badge display • Impact story features",
      gold: "• All Silver benefits • Direct organization contact • Gold tier recognition • VIP event access",
      platinum: "• All Gold benefits • Annual recognition dinner • Platinum legacy recognition • Advisory opportunities",
      new_donor: "• Welcome package • Getting started guide • Community access"
    };
    return benefits[tier] || "• Special recognition • Community benefits";
  };

  // Show confetti effect
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleViewAchievements = () => {
    onViewAchievements?.();
    navigate('/achievements');
    onClose();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'I just reached a new donation tier!',
        text: `I'm proud to announce that I've just reached the ${formatTierName(toTier)} tier on Advocate&Donate! Together, we're making a real difference.`,
        url: window.location.origin
      }).catch(console.error);
    } else {
      // Fallback to clipboard
      const shareText = `I'm proud to announce that I've just reached the ${formatTierName(toTier)} tier on Advocate&Donate! With ${formatAmount(totalAmountAtUpgrade)} donated, together we're making a real difference. Join me at ${window.location.origin}`;
      navigator.clipboard.writeText(shareText).then(() => {
        toast({
          title: 'Shared!',
          description: 'Achievement copied to clipboard. Share it with your friends!',
        });
      }).catch(() => {
        toast({
          title: 'Share',
          description: `I just reached ${formatTierName(toTier)} tier on Advocate&Donate!`,
        });
      });
    }
    onShare?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Confetti/Sparkle Background Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-4 left-4 animate-bounce">
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="absolute top-8 right-8 animate-bounce delay-75">
              <Star className="h-4 w-4 text-blue-400" />
            </div>
            <div className="absolute top-16 left-16 animate-bounce delay-150">
              <Star className="h-5 w-5 text-purple-400" />
            </div>
            <div className="absolute top-20 right-16 animate-bounce delay-300">
              <Sparkles className="h-4 w-4 text-green-400" />
            </div>
          </div>
        )}

        {/* Header with celebration colors */}
        <div 
          className="relative px-6 py-8 text-center text-white"
          style={{
            background: `linear-gradient(135deg, ${newBadgeColor}dd, ${newBadgeColor}aa)`
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="h-16 w-16 text-yellow-300 drop-shadow-lg" />
              <div className="absolute -top-2 -right-2">
                <ArrowUp className="h-6 w-6 text-white animate-bounce" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">
            Congratulations!
          </h1>
          <p className="text-lg opacity-90">
            You've been upgraded to
          </p>
          <div className="mt-3">
            <TierBadge
              tierName={toTier}
              badgeColor={newBadgeColor}
              size="xl"
              showLabel={true}
            />
          </div>
        </div>

        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-center">
            Welcome to {formatTierName(toTier)} Tier!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {getUpgradeMessage(toTier)}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-4">
          {/* Upgrade Summary */}
          <Card className="border-2" style={{ borderColor: `${newBadgeColor}40` }}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Previous Tier</p>
                  <TierBadge
                    tierName={fromTier}
                    badgeColor="#6B7280"
                    size="sm"
                    showLabel={true}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Tier</p>
                  <TierBadge
                    tierName={toTier}
                    badgeColor={newBadgeColor}
                    size="sm"
                    showLabel={true}
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Donated</p>
                <p className="text-2xl font-bold" style={{ color: newBadgeColor }}>
                  {formatAmount(totalAmountAtUpgrade)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tier Benefits */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" style={{ color: newBadgeColor }} />
              Your New Benefits
            </h3>
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {getTierBenefits(toTier)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleViewAchievements}
              className="flex-1"
              style={{ 
                backgroundColor: newBadgeColor,
                color: 'white'
              }}
            >
              <Trophy className="h-4 w-4 mr-2" />
              View Achievements
            </Button>
            
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1"
              style={{ borderColor: newBadgeColor, color: newBadgeColor }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Achievement
            </Button>
          </div>

          {/* Additional Actions */}
          <div className="flex justify-center pt-2 pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate('/donate');
                onClose();
              }}
              className="text-sm"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Continue Your Impact
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const useTierUpgradeNotification = () => {
  const [notification, setNotification] = useState<{
    show: boolean;
    fromTier: TierName;
    toTier: TierName;
    newBadgeColor: string;
    newBadgeIcon: string;
    totalAmountAtUpgrade: number;
  } | null>(null);

  const showNotification = (upgradeData: {
    fromTier: TierName;
    toTier: TierName;
    newBadgeColor: string;
    newBadgeIcon: string;
    totalAmountAtUpgrade: number;
  }) => {
    setNotification({
      show: true,
      ...upgradeData
    });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const NotificationComponent = notification ? (
    <TierUpgradeNotification
      isOpen={notification.show}
      onClose={hideNotification}
      fromTier={notification.fromTier}
      toTier={notification.toTier}
      newBadgeColor={notification.newBadgeColor}
      newBadgeIcon={notification.newBadgeIcon}
      totalAmountAtUpgrade={notification.totalAmountAtUpgrade}
    />
  ) : null;

  return {
    showNotification,
    hideNotification,
    NotificationComponent
  };
};

export default TierUpgradeNotification;
