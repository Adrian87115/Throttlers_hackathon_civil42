import BorderGlow from '@/components/Animated/BorderGlow/BorderGlow';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { ALL_EMPLOYEES } from '@/data/employees';
import { AppRoutePaths } from '@/types/types';
import {
	Car,
	GraduationCap,
	HardHat,
	HeartPulse,
	Laptop,
	ShoppingCart,
	Tractor,
	Truck,
	UtensilsCrossed,
	Wrench
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { CategoryKey } from '../MainDashboard/EmployeeCard';

const CATEGORY_ICONS: Record<CategoryKey, ReactNode> = {
	construction: <HardHat size={36} />,
	agriculture: <Tractor size={36} />,
	automotive: <Car size={36} />,
	technology: <Laptop size={36} />,
	healthcare: <HeartPulse size={36} />,
	education: <GraduationCap size={36} />,
	gastronomy: <UtensilsCrossed size={36} />,
	trade: <ShoppingCart size={36} />,
	transport: <Truck size={36} />,
	services: <Wrench size={36} />
};

const CATEGORY_STYLES: Record<
	CategoryKey,
	{ bg: string; text: string; glow: string; colors: string[]; image: string }
> = {
	construction: {
		bg: '#1a1207',
		text: 'text-amber-400',
		glow: '35 90 60',
		colors: ['#f59e0b', '#d97706', '#fbbf24'],
		image:
			'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80'
	},
	agriculture: {
		bg: '#071a0b',
		text: 'text-green-400',
		glow: '140 80 50',
		colors: ['#22c55e', '#16a34a', '#4ade80'],
		image:
			'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&q=80'
	},
	automotive: {
		bg: '#0f0d1a',
		text: 'text-violet-400',
		glow: '270 80 65',
		colors: ['#8b5cf6', '#7c3aed', '#a78bfa'],
		image:
			'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80'
	},
	technology: {
		bg: '#071219',
		text: 'text-cyan-400',
		glow: '190 90 55',
		colors: ['#06b6d4', '#0891b2', '#22d3ee'],
		image:
			'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80'
	},
	healthcare: {
		bg: '#1a070e',
		text: 'text-rose-400',
		glow: '340 80 65',
		colors: ['#f43f5e', '#e11d48', '#fb7185'],
		image:
			'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&q=80'
	},
	education: {
		bg: '#0d1419',
		text: 'text-blue-400',
		glow: '220 80 60',
		colors: ['#3b82f6', '#2563eb', '#60a5fa'],
		image:
			'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80'
	},
	gastronomy: {
		bg: '#1a0f07',
		text: 'text-orange-400',
		glow: '25 90 60',
		colors: ['#f97316', '#ea580c', '#fb923c'],
		image:
			'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=80'
	},
	trade: {
		bg: '#12071a',
		text: 'text-purple-400',
		glow: '280 70 60',
		colors: ['#a855f7', '#9333ea', '#c084fc'],
		image:
			'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80'
	},
	transport: {
		bg: '#07141a',
		text: 'text-teal-400',
		glow: '170 80 50',
		colors: ['#14b8a6', '#0d9488', '#2dd4bf'],
		image:
			'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&q=80'
	},
	services: {
		bg: '#141007',
		text: 'text-yellow-400',
		glow: '50 90 60',
		colors: ['#eab308', '#ca8a04', '#facc15'],
		image:
			'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80'
	}
};

const CATEGORIES: CategoryKey[] = [
	'construction',
	'agriculture',
	'automotive',
	'technology',
	'healthcare',
	'education',
	'gastronomy',
	'trade',
	'transport',
	'services'
];

export default function Employees() {
	const { t } = useTranslation();

	const getEmployeeCount = (cat: CategoryKey) =>
		ALL_EMPLOYEES.filter((emp) => emp.category === cat).length;

	return (
		<BaseContentWrapper className="px-8">
			<section className="mb-10">
				<h1 className="text-3xl font-bold text-gray-900">
					{t('dashboard.greeting', {
						employeeCount: ALL_EMPLOYEES.length
					})}
				</h1>
				<p className="text-base-muted-foreground mt-1">
					{t('dashboard.pickCategory')}
				</p>
			</section>

			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 px-10">
				{CATEGORIES.map((cat) => {
					const style = CATEGORY_STYLES[cat];
					const count = getEmployeeCount(cat);

					return (
						<Link
							key={cat}
							to={AppRoutePaths.categoryPage(cat)}
							className="text-left group">
							<BorderGlow
								backgroundColor={style.bg}
								glowColor={style.glow}
								colors={style.colors}
								borderRadius={16}
								glowRadius={30}
								edgeSensitivity={20}
								className="cursor-pointer transition-transform duration-200 hover:scale-[1.03]">
								<div className="relative min-h-40 overflow-hidden rounded-2xl">
									<img
										src={style.image}
										alt={t(`dashboard.categories.${cat}` as const)}
										className="absolute inset-0 w-full h-full object-cover opacity-40 blur-xs transition-opacity duration-300 group-hover:opacity-70 group-hover:blur-none"
									/>
									<div className="relative p-6 flex flex-col items-center text-center gap-3 min-h-40 justify-center">
										<div className={style.text}>{CATEGORY_ICONS[cat]}</div>
										<h3 className="text-white font-semibold text-sm">
											{t(`dashboard.categories.${cat}` as const)}
										</h3>
										<span className="text-xs text-gray-400">
											{count}{' '}
											{count === 1 ? 'osoba' : count < 5 ? 'osoby' : 'osob'}
										</span>
									</div>
								</div>
							</BorderGlow>
						</Link>
					);
				})}
			</div>
		</BaseContentWrapper>
	);
}
