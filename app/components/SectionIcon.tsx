import {
  Award,
  Calendar,
  Clock,
  CreditCard,
  Cog,
  Globe,
  GraduationCap,
  Laptop,
  Lightbulb,
  MessageCircle,
  Monitor,
  Palette,
  RefreshCw,
  Rocket,
  Smartphone,
  TrendingUp,
  Users,
  Wifi,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

const ICONS = {
  monitor: Monitor,
  laptop: Laptop,
  award: Award,
  users: Users,
  wrench: Wrench,
  lightbulb: Lightbulb,
  refresh: RefreshCw,
  globe: Globe,
  smartphone: Smartphone,
  wifi: Wifi,
  toolbox: Wrench,
  palette: Palette,
  cog: Cog,
  rocket: Rocket,
  trending: TrendingUp,
  calendar: Calendar,
  clock: Clock,
  credit: CreditCard,
  graduation: GraduationCap,
  message: MessageCircle,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

type SectionIconProps = {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'boxed' | 'plain';
  className?: string;
};

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const boxClasses = {
  sm: 'h-7 w-7 rounded-md',
  md: 'h-8 w-8 rounded-lg',
  lg: 'h-9 w-9 rounded-lg',
};

export default function SectionIcon({
  name,
  size = 'md',
  variant = 'boxed',
  className = '',
}: SectionIconProps) {
  const Icon = ICONS[name];

  if (variant === 'plain') {
    return (
      <Icon
        className={`shrink-0 text-brand-400 ${sizeClasses[size]} ${className}`}
        strokeWidth={2}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-brand-400/10 text-brand-400 ${boxClasses[size]} ${className}`}
    >
      <Icon className={sizeClasses[size]} strokeWidth={2} />
    </span>
  );
}
