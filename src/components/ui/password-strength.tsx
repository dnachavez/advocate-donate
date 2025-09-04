import React from 'react';
import { Progress } from '@/components/ui/progress';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from '@/lib/auth';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showRequirements = true,
  className
}) => {
  const validation = validatePassword(password);
  const { score, errors, suggestions } = validation;
  
  // Calculate progress percentage
  const progressValue = (score / 5) * 100;
  
  // Get strength color for progress bar
  const getProgressColor = (score: number): string => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-blue-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  if (!password) {
    return null;
  }
  
  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength Indicator */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Password Strength:</span>
          <span className={cn('font-medium', getPasswordStrengthColor(score))}>
            {getPasswordStrengthText(score)}
          </span>
        </div>
        
        <div className="relative">
          <Progress 
            value={progressValue} 
            className="h-2"
          />
          <div 
            className={cn(
              'absolute top-0 left-0 h-2 rounded-full transition-all duration-300',
              getProgressColor(score)
            )}
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>
      
      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-1">
          <RequirementItem 
            met={password.length >= 8}
            text="At least 8 characters"
          />
          <RequirementItem 
            met={/[A-Z]/.test(password)}
            text="One uppercase letter"
          />
          <RequirementItem 
            met={/[a-z]/.test(password)}
            text="One lowercase letter"
          />
          <RequirementItem 
            met={/\d/.test(password)}
            text="One number"
          />
          <RequirementItem 
            met={/[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/.test(password)}
            text="One special character"
          />
        </div>
      )}
      
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Suggestions */}
      {suggestions.length > 0 && errors.length === 0 && (
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="w-3 h-3" />
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface RequirementItemProps {
  met: boolean;
  text: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, text }) => {
  return (
    <div className={cn(
      'flex items-center gap-2 text-sm transition-colors duration-200',
      met ? 'text-green-600' : 'text-muted-foreground'
    )}>
      {met ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <div className="w-3 h-3 rounded-full border border-muted-foreground" />
      )}
      <span>{text}</span>
    </div>
  );
};

export default PasswordStrength;