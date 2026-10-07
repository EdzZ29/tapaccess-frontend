import {
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  Car,
  Clock,
  Coffee,
  CreditCard,
  Download,
  Dumbbell,
  FileText,
  Gift,
  Globe,
  GraduationCap,
  Heart,
  House,
  Info,
  UserPlus,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Navigation,
  Phone,
  Scissors,
  ShoppingBag,
  ShoppingCart,
  Star,
  Stethoscope,
  Tag,
  Ticket,
  Utensils,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { SocialPlatform } from "@/lib/types";
import { BRAND_PATHS, type BrandIcon } from "./brand-paths";
import { GoogleLogo } from "./google";

const LUCIDE: Record<string, LucideIcon> = {
  link: LinkIcon,
  globe: Globe,
  phone: Phone,
  mail: Mail,
  "message-circle": MessageCircle,
  "map-pin": MapPin,
  navigation: Navigation,
  star: Star,
  calendar: Calendar,
  clock: Clock,
  "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart,
  utensils: Utensils,
  coffee: Coffee,
  gift: Gift,
  ticket: Ticket,
  tag: Tag,
  "credit-card": CreditCard,
  download: Download,
  "file-text": FileText,
  menu: BookOpen,
  heart: Heart,
  camera: Camera,
  music: Music,
  video: Video,
  car: Car,
  home: House,
  briefcase: Briefcase,
  dumbbell: Dumbbell,
  scissors: Scissors,
  stethoscope: Stethoscope,
  "graduation-cap": GraduationCap,
  info: Info,
  "user-plus": UserPlus,
};

export function BrandMark({ name, className }: { name: BrandIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden focusable="false">
      <path d={BRAND_PATHS[name]} />
    </svg>
  );
}

/** Icon for a custom button key (see BUTTON_ICONS). Unknown keys fall back to a link. */
export function ButtonIcon({ name, className }: { name: string; className?: string }) {
  if (name in BRAND_PATHS) return <BrandMark name={name as BrandIcon} className={className} />;
  const Icon = LUCIDE[name] ?? LinkIcon;
  return <Icon className={className} aria-hidden />;
}

export function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  if (platform === "google_reviews") return <GoogleLogo className={className} />;
  if (platform in BRAND_PATHS) return <BrandMark name={platform as BrandIcon} className={className} />;
  if (platform === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
        <text x="12" y="17" textAnchor="middle" fontSize="15" fontWeight="700" fill="currentColor" fontFamily="Arial, sans-serif">
          in
        </text>
      </svg>
    );
  }
  return <Globe className={className} aria-hidden />;
}
