import BorderGlow from '@/components/Animated/BorderGlow/BorderGlow';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { useAuth } from '@/contexts/AuthUserContext';
import { ALL_EMPLOYEES } from '@/data/employees';
import { AppRoutePaths } from '@/types/types';
import {
	Award,
	Briefcase,
	Car,
	GraduationCap,
	HardHat,
	HeartPulse,
	Laptop,
	MapPin,
	ShoppingCart,
	Star,
	Tractor,
	TrendingUp,
	Truck,
	UserCheck,
	Users,
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

const totalEmployees = ALL_EMPLOYEES.length;
const availableEmployees = ALL_EMPLOYEES.filter((e) => e.available).length;
const avgExperience = Math.round(
	ALL_EMPLOYEES.reduce((sum, e) => sum + e.experience, 0) / totalEmployees
);
const topCategory = CATEGORIES.reduce((best, cat) => {
	const count = ALL_EMPLOYEES.filter((e) => e.category === cat).length;
	const bestCount = ALL_EMPLOYEES.filter((e) => e.category === best).length;
	return count > bestCount ? cat : best;
}, CATEGORIES[0]);

// Top 3 most experienced available employees
const spotlightEmployees = [...ALL_EMPLOYEES]
	.filter((e) => e.available)
	.sort((a, b) => b.experience - a.experience)
	.slice(0, 3);

export default function Employees() {
	const { t } = useTranslation();
	const { auth } = useAuth();
	const isAuthenticated = auth.user !== null;
	const getEmployeeCount = (cat: CategoryKey) =>
		ALL_EMPLOYEES.filter((emp) => emp.category === cat).length;

	const getAvailableCount = (cat: CategoryKey) =>
		ALL_EMPLOYEES.filter((emp) => emp.category === cat && emp.available).length;

	return (
		<BaseContentWrapper className="px-8">
			{/* Header */}
			<section className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900">
					{t('dashboard.greeting', { employeeCount: totalEmployees })}
				</h1>
				<p className="text-base-muted-foreground mt-1">
					{t('dashboard.pickCategory')}
				</p>
			</section>

			{/* Stats bar */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
				<div className="rounded-xl border border-base-border bg-white p-5 shadow-sm flex items-center gap-4">
					<div className="h-11 w-11 rounded-xl bg-primary-blue/10 flex items-center justify-center shrink-0">
						<Users size={22} className="text-primary-blue" />
					</div>
					<div>
						<p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
						<p className="text-xs text-gray-500">Pracowników łącznie</p>
					</div>
				</div>

				<div className="rounded-xl border border-base-border bg-white p-5 shadow-sm flex items-center gap-4">
					<div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
						<UserCheck size={22} className="text-emerald-600" />
					</div>
					<div>
						<p className="text-2xl font-bold text-gray-900">{availableEmployees}</p>
						<p className="text-xs text-gray-500">Dostępnych teraz</p>
					</div>
				</div>

				<div className="rounded-xl border border-base-border bg-white p-5 shadow-sm flex items-center gap-4">
					<div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
						<Award size={22} className="text-amber-500" />
					</div>
					<div>
						<p className="text-2xl font-bold text-gray-900">{avgExperience} lat</p>
						<p className="text-xs text-gray-500">Śr. doświadczenie</p>
					</div>
				</div>

				<div className="rounded-xl border border-base-border bg-white p-5 shadow-sm flex items-center gap-4">
					<div className="h-11 w-11 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
						<TrendingUp size={22} className="text-violet-500" />
					</div>
					<div>
						<p className="text-2xl font-bold text-gray-900">{CATEGORIES.length}</p>
						<p className="text-xs text-gray-500">Branż</p>
					</div>
				</div>
			</div>

			{/* Spotlight — top experienced */}
			<section className="mb-10">
				<div className="flex items-center gap-2 mb-4">
					<Star size={18} className="text-amber-500" />
					<h2 className="text-lg font-bold text-gray-900">Wyróżnieni pracownicy</h2>
					<span className="text-xs text-gray-400 ml-1">— najdłuższy staż, dostępni</span>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					{spotlightEmployees.map((emp, i) => (
						<Link
							key={emp.id}
							to={AppRoutePaths.employeeProfilePage(emp.id)}
							className="flex items-center gap-4 rounded-xl border border-base-border bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
							<div className="relative shrink-0">
								<div className="h-12 w-12 rounded-full bg-primary-blue/10 flex items-center justify-center">
									<Briefcase size={20} className="text-primary-blue" />
								</div>
								{i === 0 && (
									<span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center">
										<Star size={10} className="text-white" fill="white" />
									</span>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold text-gray-900 truncate">
									{isAuthenticated ? emp.name : '••••• •••••••'}
								</p>
								<p className="text-xs text-gray-500 truncate">{emp.role}</p>
								<div className="flex items-center gap-2 mt-1">
									<span className="flex items-center gap-1 text-xs text-gray-400">
										<MapPin size={10} />
										{emp.location}
									</span>
									<span className="text-xs text-primary-blue font-medium">
										{emp.experience} lat dośw.
									</span>
								</div>
							</div>
							<span className="shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
								Dostępny
							</span>
						</Link>
					))}
				</div>
			</section>

			{/* Category grid */}
			<section className="mb-10">
				<h2 className="text-xl font-bold text-gray-900 mb-1">Przeglądaj wg branży</h2>
				<p className="text-base-muted-foreground mb-6">
					Kliknij kategorię, aby zobaczyć pracowników
				</p>

				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 px-10">
					{CATEGORIES.map((cat) => {
						const style = CATEGORY_STYLES[cat];
						const count = getEmployeeCount(cat);
						const available = getAvailableCount(cat);
						const availPct = Math.round((available / count) * 100);

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
										<div className="relative p-6 flex flex-col items-center text-center gap-2 min-h-40 justify-center">
											<div className={style.text}>{CATEGORY_ICONS[cat]}</div>
											<h3 className="text-white font-semibold text-sm">
												{t(`dashboard.categories.${cat}` as const)}
											</h3>
											<span className="text-xs text-gray-400">
												{count}{' '}
												{count === 1 ? 'osoba' : count < 5 ? 'osoby' : 'osób'}
											</span>
											{/* availability bar */}
											<div className="w-full mt-1">
												<div className="h-1 rounded-full bg-white/10 overflow-hidden">
													<div
														className="h-full rounded-full bg-emerald-400 transition-all duration-500"
														style={{ width: `${availPct}%` }}
													/>
												</div>
												<p className="text-[10px] text-emerald-400 mt-1">
													{available} dostępnych
												</p>
											</div>
										</div>
									</div>
								</BorderGlow>
							</Link>
						);
					})}
				</div>
			</section>

			{/* Most popular category callout */}
			<section className="rounded-2xl border border-base-border bg-linear-to-br from-primary-blue/5 to-transparent p-6 flex items-center gap-6">
				<div className="h-14 w-14 rounded-xl bg-primary-blue/10 flex items-center justify-center shrink-0 text-primary-blue">
					{CATEGORY_ICONS[topCategory]}
				</div>
				<div className="flex-1">
					<p className="text-xs font-semibold uppercase tracking-wide text-primary-blue mb-0.5">
						Najpopularniejsza branża
					</p>
					<h3 className="text-lg font-bold text-gray-900">
						{t(`dashboard.categories.${topCategory}` as const)}
					</h3>
					<p className="text-sm text-gray-500 mt-0.5">
						{ALL_EMPLOYEES.filter((e) => e.category === topCategory).length} pracowników &middot;{' '}
						{ALL_EMPLOYEES.filter((e) => e.category === topCategory && e.available).length} dostępnych
					</p>
				</div>
				<Link
					to={AppRoutePaths.categoryPage(topCategory)}
					className="shrink-0 px-5 py-2.5 rounded-lg bg-primary-blue text-white text-sm font-medium hover:bg-primary-blue/90 transition-colors shadow-sm">
					Zobacz wszystkich
				</Link>
			</section>
		</BaseContentWrapper>
	);
}
