import BorderGlow from '@/components/Animated/BorderGlow/BorderGlow';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { useAuth } from '@/contexts/AuthUserContext';
import { ALL_VOLUNTEERS } from '@/data/volunteers';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { getMyProfile } from '@/services/auth';
import { AppRoutePaths } from '@/types/types';
import {
	Car,
	GraduationCap,
	Handshake,
	HardHat,
	Heart,
	HeartPulse,
	Laptop,
	Lock,
	Phone,
	Shield,
	ShoppingCart,
	Tractor,
	Truck,
	Users,
	UtensilsCrossed,
	Wrench
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
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

export default function Volunteers() {
	const { t } = useTranslation();
	const { auth } = useAuth();
	const { callWithToken } = useAuthenticatedApi();
	const isAuthenticated = auth.user !== null;
	const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>(
		null
	);
	const [isGovernmentOrg, setIsGovernmentOrg] = useState(false);

	useEffect(() => {
		if (!isAuthenticated || auth.isLoading) return;
		callWithToken(getMyProfile)
			.then((profile: any) => {
				setIsGovernmentOrg(
					profile?.account_type === 'employer' &&
						(profile?.is_government_service === true ||
							profile?.institution_type === 'government')
				);
			})
			.catch(() => {});
	}, [isAuthenticated, auth.isLoading]);

	const getVolunteerCount = (cat: CategoryKey) =>
		ALL_VOLUNTEERS.filter((v) => v.category === cat).length;

	const getAvailableCount = (cat: CategoryKey) =>
		ALL_VOLUNTEERS.filter((v) => v.category === cat && v.available).length;

	const expandedVolunteers = expandedCategory
		? ALL_VOLUNTEERS.filter((v) => v.category === expandedCategory)
		: [];

	return (
		<BaseContentWrapper className="px-8">
			{/* Header */}
			<section className="mb-10">
				<h1 className="text-3xl font-bold text-gray-900">
					{t('volunteers.title', 'Wolontariat')}
				</h1>
				<p className="text-base-muted-foreground mt-1">
					{t(
						'volunteers.subtitle',
						'Dołącz do akcji pomocowych i wspieraj lokalne społeczności'
					)}
				</p>
				<p className="text-sm text-gray-500 mt-2">
					{ALL_VOLUNTEERS.length} wolontariuszy &middot;{' '}
					{ALL_VOLUNTEERS.filter((v) => v.available).length} dostępnych
				</p>
			</section>

			{/* Info cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
				<div className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
					<div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
						<Heart size={24} className="text-rose-500" />
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Akcje społeczne
					</h3>
					<p className="text-sm text-gray-600">
						Pomagaj w organizacji zbiórek, wydarzeń charytatywnych i lokalnych
						inicjatyw na rzecz osób potrzebujących.
					</p>
				</div>

				<div className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
					<div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
						<Shield size={24} className="text-amber-500" />
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Sytuacje kryzysowe
					</h3>
					<p className="text-sm text-gray-600">
						Zgłoś gotowość do pomocy w sytuacjach awaryjnych. Służby państwowe
						mogą szybko skontaktować się z wolontariuszami w Twoim regionie.
					</p>
				</div>

				<div className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
					<div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
						<Users size={24} className="text-blue-500" />
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Wsparcie logistyczne
					</h3>
					<p className="text-sm text-gray-600">
						Udostępnij swoje zasoby — pojazdy, sprzęt lub umiejętności — gdy
						będą najbardziej potrzebne.
					</p>
				</div>
			</div>

			{/* Category browsing grid */}
			<section className="mb-12">
				<h2 className="text-xl font-bold text-gray-900 mb-1">
					Przeglądaj wolontariuszy wg kategorii
				</h2>
				<p className="text-base-muted-foreground mb-6">
					Kliknij kategorię, aby zobaczyć dostępnych wolontariuszy
				</p>

				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 px-10">
					{CATEGORIES.map((cat) => {
						const style = CATEGORY_STYLES[cat];
						const count = getVolunteerCount(cat);
						const available = getAvailableCount(cat);

						return (
							<button
								key={cat}
								onClick={() =>
									setExpandedCategory(expandedCategory === cat ? null : cat)
								}
								className={`text-left group cursor-pointer ${expandedCategory === cat ? 'ring-2 ring-primary-blue rounded-2xl' : ''}`}>
								<BorderGlow
									backgroundColor={style.bg}
									glowColor={style.glow}
									colors={style.colors}
									borderRadius={16}
									glowRadius={30}
									edgeSensitivity={20}
									className="transition-transform duration-200 hover:scale-[1.03]">
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
												{count === 1
													? 'wolontariusz'
													: count < 5
														? 'wolontariuszy'
														: 'wolontariuszy'}
												{' · '}
												<span className="text-emerald-400">
													{available} dostępnych
												</span>
											</span>
										</div>
									</div>
								</BorderGlow>
							</button>
						);
					})}
				</div>
			</section>

			{/* Expanded volunteer list */}
			{expandedCategory && (
				<section className="mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-bold text-gray-900">
							{t(`dashboard.categories.${expandedCategory}` as const)} —
							wolontariusze
						</h2>
						<button
							onClick={() => setExpandedCategory(null)}
							className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
							Zamknij
						</button>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{expandedVolunteers.map((v) => (
							<div
								key={v.id}
								className="flex items-center gap-4 rounded-xl border border-base-border bg-white p-4 shadow-sm">
								<div className="h-11 w-11 rounded-full bg-dimmed-blue/20 flex items-center justify-center shrink-0">
									<Users size={20} className="text-primary-blue" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-900 truncate">
										{isAuthenticated ? v.name : '••••• •••••••'}
									</p>
									<p className="text-xs text-gray-500">
										{v.role} &middot; {v.experience}{' '}
										{v.experience === 1
											? 'rok'
											: v.experience < 5
												? 'lata'
												: 'lat'}{' '}
										doświadczenia
									</p>
									<div className="flex items-center gap-1 mt-1">
										{!isAuthenticated ? (
											<>
												<Lock size={11} className="text-gray-400 shrink-0" />
												<span className="text-xs text-gray-400 italic">
													Zaloguj się, aby nawiązać kontakt
												</span>
											</>
										) : isGovernmentOrg ? (
											<>
												<Phone size={11} className="text-gray-400 shrink-0" />
												<span className="text-xs text-primary-blue">
													{v.phone}
												</span>
											</>
										) : (
											<>
												<Phone size={11} className="text-gray-400 shrink-0" />
												<span className="text-xs text-primary-blue cursor-pointer hover:underline">
													Wyślij wiadomość
												</span>
											</>
										)}
									</div>
								</div>
								<span
									className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
										v.available
											? 'bg-green-100 text-green-700'
											: 'bg-red-100 text-red-600'
									}`}>
									{v.available ? 'Dostępny' : 'Niedostępny'}
								</span>
							</div>
						))}
					</div>
				</section>
			)}

			{/* CTA */}
			<section className="rounded-2xl border border-base-border bg-linear-to-br from-primary-blue/5 to-transparent p-8 text-center">
				<Handshake size={48} className="text-primary-blue mx-auto mb-4" />
				<h2 className="text-2xl font-bold text-gray-900 mb-3">
					Chcesz zostać wolontariuszem?
				</h2>
				<p className="text-gray-600 max-w-lg mx-auto mb-6">
					Uzupełnij swój profil, zaznacz gotowość do wolontariatu i określ swoje
					kwalifikacje. Otrzymasz powiadomienia o akcjach w Twoim regionie.
				</p>
				<Link
					to={AppRoutePaths.volunteerSignup()}
					className="inline-block px-6 py-3 rounded-lg bg-primary-blue text-white font-medium hover:bg-primary-blue/90 transition-colors shadow-sm cursor-pointer">
					Dołącz do wolontariuszy
				</Link>
			</section>
		</BaseContentWrapper>
	);
}
