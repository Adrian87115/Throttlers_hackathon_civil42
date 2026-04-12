import { useAuth } from '@/contexts/AuthUserContext';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import apiClient from '@/services/apiClient';
import { getUserMe } from '@/services/auth';
import { getActiveCrisis } from '@/services/crisis';
import { AppApiPaths, AppRoutePaths } from '@/types/types';
import {
	AlertTriangle,
	Handshake,
	LogOut,
	MapPin,
	Search,
	Settings,
	Shield,
	User,
	X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BaseDropdown } from '../Dropdowns/BaseDropdown';
import AppLogo from '../icons/AppLogo/AppLogo';
import UserProfilePicture from '../icons/UserProfilePicture/UserProfilePicture';

const CRISIS_STATUS_EVENT = 'crisis-status-changed';

export default function Header() {
	const { getUser, resetAuth } = useAuth();
	const { callWithToken } = useAuthenticatedApi();
	const user = getUser();
	const { t } = useTranslation();
	const location = useLocation();

	const navigate = useNavigate();
	const [search, setSearch] = useState('');
	const [searchOpen, setSearchOpen] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [hasActiveCrisis, setHasActiveCrisis] = useState(false);
	const searchRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		let isCancelled = false;

		async function resolveOwner() {
			if (!user) {
				setIsOwner(false);
				return;
			}

			try {
				const me = await callWithToken(getUserMe);
				if (!isCancelled) {
					setIsOwner(me.role === 'owner' || me.isOwner === true);
				}
			} catch {
				if (!isCancelled) {
					setIsOwner(false);
				}
			}
		}

		resolveOwner();

		return () => {
			isCancelled = true;
		};
	}, [user]);

	useEffect(() => {
		let isCancelled = false;
		let isRefreshing = false;

		async function resolveActiveCrisis() {
			if (isRefreshing) return;
			isRefreshing = true;

			try {
				if (user) {
					const activeCrisis = await callWithToken(getActiveCrisis);
					if (!isCancelled) {
						setHasActiveCrisis(Boolean(activeCrisis));
					}
					return;
				}

				const activeCrisis = await apiClient.get(AppApiPaths.getActiveCrisis());
				if (!isCancelled) {
					setHasActiveCrisis(Boolean(activeCrisis));
				}
			} catch {
				if (!isCancelled) {
					setHasActiveCrisis(false);
				}
			} finally {
				isRefreshing = false;
			}
		}

		resolveActiveCrisis();
		const intervalId = window.setInterval(resolveActiveCrisis, 30_000);

		return () => {
			isCancelled = true;
			window.clearInterval(intervalId);
		};
	}, [callWithToken, user]);

	useEffect(() => {
		function handleCrisisStatusChanged(event: Event) {
			const customEvent = event as CustomEvent<{ active?: boolean }>;
			setHasActiveCrisis(Boolean(customEvent.detail?.active));
		}

		window.addEventListener(
			CRISIS_STATUS_EVENT,
			handleCrisisStatusChanged as EventListener
		);

		return () => {
			window.removeEventListener(
				CRISIS_STATUS_EVENT,
				handleCrisisStatusChanged as EventListener
			);
		};
	}, []);

	function handleLogout() {
		resetAuth();
	}

	function openSearch() {
		setSearchOpen(true);
		setTimeout(() => searchRef.current?.focus(), 100);
	}

	function closeSearch() {
		setSearchOpen(false);
		setSearch('');
	}

	function handleSearchSubmit() {
		if (search.trim()) {
			navigate(AppRoutePaths.searchPage(search.trim()));
			closeSearch();
		}
	}

	const navLinks = [
		{
			to: AppRoutePaths.mainDashboard(),
			label: t('header.mainDashboard'),
			icon: null
		},
		{
			to: AppRoutePaths.mapPage(),
			label: t('header.map'),
			icon: <MapPin size={16} />
		},
		{
			to: AppRoutePaths.employees(),
			label: t('header.employees'),
			icon: <User size={16} />
		},
		{
			to: AppRoutePaths.volunteers(),
			label: t('header.volunteers'),
			icon: <Handshake size={16} />
		},
		{
			to: AppRoutePaths.crisis(),
			label: 'Kryzys',
			icon: <AlertTriangle size={16} />,
			isCrisis: true,
			hasActiveCrisis
		}
	];

	return (
		<header className="fixed top-0 z-100 w-full border-b border-gray-400/40 bg-white/80 backdrop-blur-xl">
			<div className="mx-auto flex h-16 max-w-8xl items-center px-6 gap-2">
				{/* Logo */}
				<Link
					to={AppRoutePaths.mainDashboard()}
					className="shrink-0 mr-6 transition-opacity hover:opacity-80">
					<AppLogo className="h-8" />
				</Link>

				{/* Nav links */}
				<nav className="hidden sm:flex items-center gap-1">
					{navLinks.map((link) => {
						const isActive = location.pathname === link.to;
						const { isCrisis, hasActiveCrisis: crisisActive } = link as {
							isCrisis?: boolean;
							hasActiveCrisis?: boolean;
						};
						return (
							<Link
								key={`${link.to}-${link.label}`}
								to={link.to}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
									isCrisis
										? crisisActive
											? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
											: 'border border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50'
										: isActive
											? 'bg-primary-blue/10 text-primary-blue'
											: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
								}`}>
								{link.icon}
								{link.label}
							</Link>
						);
					})}
				</nav>

				{/* Spacer */}
				<div className="flex-1" />

				{/* Search toggle */}
				<div className="relative flex items-center">
					<div
						className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
							searchOpen ? 'w-64' : 'w-0'
						}`}>
						<input
							ref={searchRef}
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Escape') closeSearch();
								if (e.key === 'Enter') handleSearchSubmit();
							}}
							placeholder={t('header.searchPlaceholder')}
							className="w-full h-9 pl-3 pr-8 rounded-lg border border-base-border bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-blue focus:bg-white transition-colors"
						/>
						{searchOpen && (
							<button
								onClick={closeSearch}
								className="absolute right-0 p-2 text-gray-400 hover:text-gray-600 transition-colors">
								<X size={16} />
							</button>
						)}
					</div>
					{!searchOpen && (
						<button
							onClick={openSearch}
							className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200">
							<Search size={18} />
						</button>
					)}
					{/* Search label — appears when text is typed */}
					{searchOpen && search.trim() && (
						<button
							onClick={handleSearchSubmit}
							className="absolute top-full mt-1 left-0 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-base-border shadow-md text-sm text-primary-blue hover:bg-gray-50 transition-colors cursor-pointer z-50">
							<Search size={14} />
							<span className="truncate">
								{t('header.searchLabel', { query: search.trim() })}
							</span>
						</button>
					)}
				</div>

				{/* Divider */}
				<div className="h-6 w-px bg-gray-200 mx-1" />

				{/* Auth area */}
				{user ? (
					<BaseDropdown
						trigger={
							<button className="flex items-center gap-2.5 rounded-xl py-1.5 pl-3 pr-1.5 transition-all duration-200 hover:bg-gray-100 cursor-pointer">
								<span className="text-sm font-medium text-gray-700 hidden sm:block">
									{user.email}
								</span>
								<UserProfilePicture className="h-8! w-8!" />
							</button>
						}
						contentClassName="w-52"
						items={[
							{
								label: t('header.yourAccount'),
								isLabel: true
							},
							{ separator: true },
							{
								icon: <User size={16} />,
								label: (
									<Link
										to={
											user.accountType === 'employer'
												? AppRoutePaths.orgProfile()
												: AppRoutePaths.userProfile()
										}
										className="w-full">
										{t('header.profile')}
									</Link>
								)
							},
							{
								icon: <Settings size={16} />,
								label: (
									<Link to={AppRoutePaths.userSettings()} className="w-full">
										{t('header.settings')}
									</Link>
								)
							},
							...(isOwner
								? [
										{
											icon: <Shield size={16} />,
											label: (
												<Link
													to={AppRoutePaths.ownerVerifications()}
													className="w-full">
													Panel właściciela
												</Link>
											)
										}
									]
								: []),
							{ separator: true },
							{
								icon: <LogOut size={16} />,
								label: t('header.logout'),
								onClick: handleLogout,
								destructive: true
							}
						]}
					/>
				) : (
					<Link to={AppRoutePaths.loginPage()}>
						<button className="px-4 py-2 rounded-lg bg-primary-blue text-white text-sm font-medium hover:bg-primary-blue/90 transition-colors shadow-sm cursor-pointer">
							{t('login.login')}
						</button>
					</Link>
				)}
			</div>
		</header>
	);
}
