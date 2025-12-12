import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { Button } from './button';
import { 
  Award, 
  Star, 
  Trophy, 
  Crown, 
  User,
  ChevronRight 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import type { 
  BadgeDisplayProps, 
  GamificationTier, 
  TierName,
  BADGE_SIZES 
} from '../../types/gamification';

// Icon mapping for tier badges
const TIER_ICONS = {
  new_donor: User,
  bronze: Award,
  silver: Star,
  gold: Trophy,
  platinum: Crown
} as const;

interface UserBadgeProps extends Omit<BadgeDisplayProps, 'tier'> {
  tier?: GamificationTier | null;
  isLoading?: boolean;
  showProgress?: boolean;
  progressPercentage?: number;
  nextTierName?: string;
  amountToNextTier?: number;
  totalDonationAmount?: number;
}

export const UserBadge: React.FC<UserBadgeProps> = ({
  tier,
  size = 'md',
  showLabel = true,
  clickable = true,
  showProgress = false,
  progressPercentage = 0,
  nextTierName,
  amountToNextTier,
  totalDonationAmount = 0,
  isLoading = false,
  className,
  onClick
}) => {
  // Default values for new donors or loading state
  const displayTier = tier || {
    tier_name: 'new_donor' as TierName,
    badge_color: '#6B7280',
    badge_icon: 'user',
    description: 'Welcome to our community!'
  };

  const IconComponent = TIER_ICONS[displayTier.tier_name as TierName] || User;
  
  const sizeConfig = {
    sm: { icon: 14, badge: 'text-xs', height: 'h-6' },
    md: { icon: 16, badge: 'text-sm', height: 'h-8' },
    lg: { icon: 20, badge: 'text-base', height: 'h-10' },
    xl: { icon: 24, badge: 'text-lg', height: 'h-12' }
  };

  const config = sizeConfig[size];

  // Format tier name for display
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

  const tooltipContent = (
    <div className="space-y-2 max-w-xs">
      <div className="font-semibold">
        {formatTierName(displayTier.tier_name)}
      </div>
      <div className="text-sm text-muted-foreground">
        {displayTier.description}
      </div>
      {totalDonationAmount > 0 && (
        <div className="text-sm">
          <div>Total donated: {formatAmount(totalDonationAmount)}</div>
        </div>
      )}
      {showProgress && nextTierName && amountToNextTier && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Progress to {formatTierName(nextTierName)}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {formatAmount(amountToNextTier)} to next tier
          </div>
        </div>
      )}
      {clickable && (
        <div className="text-xs text-muted-foreground border-t pt-2">
          Click to view your achievements
        </div>
      )}
    </div>
  );

  const badgeContent = (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-2 font-medium transition-all duration-200',
        config.height,
        config.badge,
        clickable && 'hover:scale-105 cursor-pointer',
        isLoading && 'animate-pulse',
        className
      )}
      style={{
        backgroundColor: `${displayTier.badge_color}20`,
        borderColor: displayTier.badge_color,
        color: displayTier.badge_color,
      }}
      onClick={clickable ? onClick : undefined}
    >
      <IconComponent 
        size={config.icon} 
        className={cn(
          'transition-colors',
          isLoading && 'animate-pulse'
        )}
        style={{ color: displayTier.badge_color }}
      />
      {showLabel && !isLoading && (
        <>
          <span>{formatTierName(displayTier.tier_name)}</span>
          {clickable && <ChevronRight size={12} className="opacity-70" />}
        </>
      )}
      {isLoading && (
        <span className="text-xs">Loading...</span>
      )}
    </Badge>
  );

  if (clickable && !isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent"
              onClick={onClick}
            >
              {badgeContent}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="p-3">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block">
            {badgeContent}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="p-3">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Simplified version for display-only purposes
export const TierBadge: React.FC<{
  tierName: TierName;
  badgeColor: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}> = ({
  tierName,
  badgeColor,
  size = 'md',
  showLabel = true,
  className
}) => {
  const IconComponent = TIER_ICONS[tierName] || User;
  
  const sizeConfig = {
    sm: { icon: 14, badge: 'text-xs', height: 'h-6' },
    md: { icon: 16, badge: 'text-sm', height: 'h-8' },
    lg: { icon: 20, badge: 'text-base', height: 'h-10' },
    xl: { icon: 24, badge: 'text-lg', height: 'h-12' }
  };

  const config = sizeConfig[size];

  const formatTierName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-2 font-medium',
        config.height,
        config.badge,
        className
      )}
      style={{
        backgroundColor: `${badgeColor}20`,
        borderColor: badgeColor,
        color: badgeColor,
      }}
    >
      <IconComponent 
        size={config.icon} 
        style={{ color: badgeColor }}
      />
      {showLabel && (
        <span>{formatTierName(tierName)}</span>
      )}
    </Badge>
  );
};

export default UserBadge;
