import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart, Search, User, LogOut, Settings, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { userService, UserProfile } from "@/lib/userService";
import { UserBadge } from "@/components/ui/UserBadge";
import { useAchievement, useTierProgress } from "@/hooks/useGamification";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Gamification hooks
  const { achievement, isLoading: achievementLoading } = useAchievement();
  const { progress, isLoading: progressLoading } = useTierProgress();

  const navItems = [
    { label: "Organizations", href: "/organizations" },
    { label: "Campaigns", href: "/campaigns" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about" }
  ];

  // Fetch user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchUserProfile = async () => {
        const { data: profile } = await userService.getCurrentUserProfile();
        setUserProfile(profile);
      };
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [isAuthenticated, user]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
            <img
              src="/logo-transparent.png"
              alt="Advocate&Donate logo"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="text-xl font-bold text-foreground">Advocate&Donate</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-smooth font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Search className="w-4 h-4" />
            </Button>

            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : isAuthenticated ? (
              <>
                {/* User Achievement Badge */}
                <UserBadge
                  tier={progress?.currentTier}
                  isLoading={achievementLoading || progressLoading}
                  showProgress={true}
                  progressPercentage={progress?.progressPercentage || 0}
                  nextTierName={progress?.nextTier?.tier_name}
                  amountToNextTier={progress?.amountToNextTier}
                  totalDonationAmount={achievement?.total_donation_amount || 0}
                  size="sm"
                  onClick={() => navigate('/achievements')}
                />

                <Button asChild variant="donate" size="sm">
                  <Link to="/donate">Donate Now</Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {user?.user_metadata?.fullName || user?.email?.split('@')[0] || 'User'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {user?.user_metadata?.fullName || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/donations" className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        My Donations
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/achievements" className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Achievements
                      </Link>
                    </DropdownMenuItem>
                    {userProfile?.user_type === 'nonprofit' && (
                      <DropdownMenuItem asChild>
                        <Link to="/create-campaign" className="flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Create Campaign
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={signOut}
                      className="flex items-center gap-2 text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/auth">
                    <User className="w-4 h-4" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild variant="donate" size="sm">
                  <Link to="/donate">Donate Now</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="py-4 space-y-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block text-muted-foreground hover:text-foreground transition-smooth font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col space-y-3 pt-4 border-t border-border">
              {loading ? (
                <div className="flex justify-center items-center space-x-2 py-4">
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : isAuthenticated ? (
                <>
                  <div className="px-2 py-1 space-y-2">
                    <div>
                      <p className="text-sm font-medium">
                        {user?.user_metadata?.fullName || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                    {/* Mobile Achievement Badge */}
                    <div className="flex justify-center">
                      <UserBadge
                        tier={progress?.currentTier}
                        isLoading={achievementLoading || progressLoading}
                        showProgress={true}
                        progressPercentage={progress?.progressPercentage || 0}
                        nextTierName={progress?.nextTier?.tier_name}
                        amountToNextTier={progress?.amountToNextTier}
                        totalDonationAmount={achievement?.total_donation_amount || 0}
                        size="md"
                        onClick={() => {
                          navigate('/achievements');
                          setIsMenuOpen(false);
                        }}
                      />
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <User className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/achievements" onClick={() => setIsMenuOpen(false)}>
                      <Award className="w-4 h-4" />
                      Achievements
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/create-campaign" onClick={() => setIsMenuOpen(false)}>
                      <Heart className="w-4 h-4" />
                      Create Campaign
                    </Link>
                  </Button>
                  <Button asChild variant="donate" size="sm">
                    <Link to="/donate" onClick={() => setIsMenuOpen(false)}>
                      Donate Now
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      <User className="w-4 h-4" />
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild variant="donate" size="sm">
                    <Link to="/donate" onClick={() => setIsMenuOpen(false)}>
                      Donate Now
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;