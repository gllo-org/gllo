import {
  Building,
  BookOpen,
  Drama,
  FileText,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  PiggyBank,
  Plane,
  Repeat,
  Shield,
  Shirt,
  Smartphone,
  Stethoscope,
  TicketsPlane,
  TrainFront,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * 카테고리 이름 → 아이콘 매핑.
 * 키 순서대로 부분 일치(`includes`) 검사하므로 더 구체적인 키가 앞에 오도록 유지한다.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  '식비': UtensilsCrossed,
  '교통': TrainFront,
  '주거비': House,
  '의류': Shirt,
  '의료': Stethoscope,
  '건강': HeartPulse,
  '교육': BookOpen,
  '문화': Drama,
  '통신': Smartphone,
  '보험': Shield,
  '용돈': PiggyBank,
  '항공권': TicketsPlane,
  '여행': Plane,
  '비자': FileText,
  '보증금': Landmark,
  '기숙사': Building,
  '장학금': GraduationCap,
  '월세': House,
  '구독': Repeat,
  '기타': Wallet,
};

export function categoryIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Wallet;
  for (const [keyword, icon] of Object.entries(CATEGORY_ICONS)) {
    if (name.includes(keyword)) return icon;
  }
  return Wallet;
}
