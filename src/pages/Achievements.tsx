import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserBadge, TierBadge } from '@/components/ui/UserBadge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Award,
  TrendingUp,
  Calendar,
  Heart,
  Target,
  Users,
  Gift,
  ArrowUp,
  Settings,
  Share2,
  Eye,
  EyeOff,
  Info,
  Trophy
} from 'lucide-react';
import {
  useAchievement,
  useTierProgress,
  useAchievementStats,
  usePrivacySettings,
  useGamificationTiers
} from '@/hooks/useGamification';
import type { TierUpgrade, TierName } from '@/types/gamification';

const Achievements: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // Fetch achievement data
  const { achievement, isLoading: achievementLoading, error: achievementError, refresh: refreshAchievement } = useAchievement();
  const { progress, isLoading: progressLoading, error: progressError } = useTierProgress();
  const { stats, isLoading: statsLoading, error: statsError } = useAchievementStats();
  const { settings: privacySettings, isLoading: privacyLoading, updateSettings, isUpdating } = usePrivacySettings();
  const { tiers, isLoading: tiersLoading } = useGamificationTiers();

  const isLoading = achievementLoading || progressLoading || statsLoading || privacyLoading || tiersLoading;
  const hasError = achievementError || progressError || statsError;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth?tab=login&redirect=/achievements');
    }
  }, [user, navigate]);

  // Handle privacy setting changes
  const handlePrivacyChange = async (setting: keyof typeof privacySettings, value: boolean) => {
    if (!privacySettings) return;

    try {
      await updateSettings({ [setting]: value });
      toast({
        title: 'Privacy settings updated',
        description: 'Your privacy preferences have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error updating settings',
        description: 'Failed to update privacy settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Parse tier upgrade history
  const getTierUpgradeHistory = (): TierUpgrade[] => {
    if (!achievement?.tier_upgrade_history) return [];
    
    try {
      const history = Array.isArray(achievement.tier_upgrade_history) 
        ? achievement.tier_upgrade_history 
        : JSON.parse(achievement.tier_upgrade_history as string);
      
      return history.sort((a: TierUpgrade, b: TierUpgrade) => 
        new Date(b.upgradeDate).getTime() - new Date(a.upgradeDate).getTime()
      );
    } catch {
      return [];
    }
  };

  if (!user) {
    return null; // Will redirect
  }

  if (hasError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {achievementError || progressError || statsError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Achievements</h1>
          <p className="text-muted-foreground mt-1">
            Track your donation journey and see your impact
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPrivacySettings(!showPrivacySettings)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Privacy Settings
        </Button>
      </div>

      {/* Privacy Settings */}
      {showPrivacySettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Privacy Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Public Badge</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your tier badge on your public profile
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings?.showPublicBadge || false}
                    onCheckedChange={(checked) => handlePrivacyChange('showPublicBadge', checked)}
                    disabled={isUpdating}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Share Tier Upgrades</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow sharing when you reach a new tier
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings?.shareUpgrades || false}
                    onCheckedChange={(checked) => handlePrivacyChange('shareUpgrades', checked)}
                    disabled={isUpdating}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show in Leaderboards</Label>
                    <p className="text-sm text-muted-foreground">
                      Include your achievements in community leaderboards
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings?.showInLeaderboards || false}
                    onCheckedChange={(checked) => handlePrivacyChange('showInLeaderboards', checked)}
                    disabled={isUpdating}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Tier and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Current Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <UserBadge
                    tier={progress?.currentTier}
                    size="xl"
                    clickable={false}
                    showLabel={true}
                  />
                </div>
                <p className="text-center text-muted-foreground">
                  {progress?.currentTier?.description}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Progress to Next Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress to Next Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : progress?.nextTier ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span>Progress to {progress.nextTier.tier_name.replace('_', ' ').toUpperCase()}</span>
                  <span>{Math.round(progress.progressPercentage)}%</span>
                </div>
                <Progress value={progress.progressPercentage} className="h-3" />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatAmount(progress.progressAmount)} donated</span>
                  <span>{formatAmount(progress.amountToNextTier || 0)} to go</span>
                </div>
                <div className="flex justify-center mt-4">
                  <TierBadge
                    tierName={progress.nextTier.tier_name as TierName}
                    badgeColor={progress.nextTier.badge_color}
                    size="lg"
                    showLabel={true}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                <p className="text-lg font-semibold">Congratulations!</p>
                <p className="text-muted-foreground">You've reached the highest tier!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatAmount(stats?.totalDonationAmount || 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total Donated</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats?.totalDonationsCount || 0}
                </div>
                <p className="text-sm text-muted-foreground">Donations Made</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats?.organizationsSupportedCount || 0}
                </div>
                <p className="text-sm text-muted-foreground">Organizations Supported</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats?.tierUpgradeCount || 0}
                </div>
                <p className="text-sm text-muted-foreground">Tier Upgrades</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestone Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Donation:</span>
                  <span className="font-medium">{formatDate(stats?.firstDonationDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latest Tier Upgrade:</span>
                  <span className="font-medium">{formatDate(stats?.lastTierUpgradeDate)}</span>
                </div>
                {stats?.daysSinceFirstDonation && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days Active:</span>
                    <span className="font-medium">{stats.daysSinceFirstDonation}</span>
                  </div>
                )}
                {stats?.averageDonationAmount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Donation:</span>
                    <span className="font-medium">{formatAmount(stats.averageDonationAmount)}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Tier Upgrade History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5" />
              Tier Upgrade History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-20" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {getTierUpgradeHistory().length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No tier upgrades yet. Keep donating to unlock new tiers!
                  </p>
                ) : (
                  getTierUpgradeHistory().map((upgrade, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <TierBadge
                        tierName={upgrade.toTier as TierName}
                        badgeColor={tiers.find(t => t.tier_name === upgrade.toTier)?.badge_color || '#6B7280'}
                        size="sm"
                        showLabel={false}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Upgraded to {upgrade.toTier.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(upgrade.upgradeDate)} • {formatAmount(upgrade.totalAmountAtUpgrade)} total
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Tiers Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            All Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tiers
                .filter(tier => tier.is_active)
                .sort((a, b) => a.tier_order - b.tier_order)
                .map((tier) => {
                  const isCurrentTier = tier.tier_name === achievement?.current_tier;
                  const isUnlocked = stats && stats.totalDonationAmount >= tier.minimum_amount;
                  
                  return (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCurrentTier 
                          ? 'border-primary bg-primary/5' 
                          : isUnlocked 
                            ? 'border-muted bg-background' 
                            : 'border-dashed border-muted-foreground/30 bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <TierBadge
                          tierName={tier.tier_name as TierName}
                          badgeColor={tier.badge_color}
                          size="sm"
                          showLabel={false}
                        />
                        <div>
                          <h3 className="font-semibold text-sm">
                            {tier.tier_name.replace('_', ' ').toUpperCase()}
                          </h3>
                          {isCurrentTier && (
                            <Badge variant="outline" className="text-xs">Current</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {tier.description}
                      </p>
                      <p className="text-xs font-medium">
                        Requires: {formatAmount(tier.minimum_amount)}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Achievements;
