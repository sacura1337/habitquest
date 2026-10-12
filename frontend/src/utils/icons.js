/**
 * Соответствие между названиями иконок на сервере и компонентами lucide-react.
 *
 * В базе данных категория хранит название иконки в «коротком» виде
 * (`heart-pulse`, `book`, `flame`). Библиотека lucide-react экспортирует
 * компоненты в PascalCase, поэтому названия нужно перевести.
 */

import {
  Activity,
  Apple,
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Coffee,
  Dumbbell,
  Droplets,
  Flame,
  Footprints,
  GraduationCap,
  HeartPulse,
  Leaf,
  Moon,
  Music,
  Palette,
  PenLine,
  Pizza,
  Sparkles,
  Sun,
  Target,
  Timer,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'

const ICON_MAP = {
  activity: Activity,
  apple: Apple,
  award: Award,
  book: BookOpen,
  brain: Brain,
  briefcase: Briefcase,
  coffee: Coffee,
  dumbbell: Dumbbell,
  droplets: Droplets,
  flame: Flame,
  footprints: Footprints,
  graduation: GraduationCap,
  'graduation-cap': GraduationCap,
  'heart-pulse': HeartPulse,
  heart: HeartPulse,
  leaf: Leaf,
  moon: Moon,
  music: Music,
  palette: Palette,
  'pen-line': PenLine,
  pen: PenLine,
  pizza: Pizza,
  sparkles: Sparkles,
  sun: Sun,
  target: Target,
  timer: Timer,
  users: Users,
  wallet: Wallet,
  zap: Zap,
}

/** Получить компонент иконки по названию с сервера. */
export function iconByName(name) {
  if (!name) return Leaf
  const key = String(name).trim().toLowerCase()
  return ICON_MAP[key] ?? Leaf
}

/** Готовые названия иконок — предлагаются в форме создания привычки. */
export const ICON_CHOICES = [
  'leaf',
  'heart-pulse',
  'book',
  'dumbbell',
  'droplets',
  'brain',
  'sun',
  'moon',
  'target',
  'sparkles',
  'coffee',
  'footprints',
]

/**
 * Подобрать класс оформления по HEX-цвету категории.
 *
 * В макете используются четыре тона, поэтому цвет с сервера сводится
 * к ближайшему из них по первому каналу RGB.
 */
export function toneByColor(color) {
  if (!color || typeof color !== 'string') return 'purple'
  const match = color.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!match) return 'purple'

  const [r, g, b] = match.slice(1).map((part) => parseInt(part, 16))

  if (g > r && g > b) return 'green'
  if (b > r && b > g) return 'blue'
  if (r > 200 && g > 120 && b < 100) return 'orange'
  return 'purple'
}
