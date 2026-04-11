import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { useAuth } from '@/contexts/AuthUserContext';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { ALL_EMPLOYEES } from '@/data/employees';
import { getMyProfile, getUserMe } from '@/services/auth';
import envConfig from '@/types/envConfig';
import {
	APIProvider,
	Map,
	useMap,
	useMapsLibrary
} from '@vis.gl/react-google-maps';
import { ChevronLeft, MapPin, UserRound, Users, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CategoryKey } from '../MainDashboard/EmployeeCard';
import type { District, DistrictEmployee } from './districts';
import { LUBLIN_DISTRICTS } from './districts';

interface UserVerificationSnapshot {
	is_verified?: boolean;
	verification_status?: string;
}

interface UserMeSnapshot {
	isOwner?: boolean;
}

const GOOGLE_MAPS_API_KEY = envConfig.googlemaps.token || '';

const LUBLIN_CENTER = { lat: 51.2465, lng: 22.5685 };
const DEFAULT_ZOOM = 12;

function DistrictPolygons({
	onDistrictClick,
	selectedDistrictId
}: {
	onDistrictClick: (district: District) => void;
	selectedDistrictId: string | null;
}) {
	const map = useMap();
	const geometryLib = useMapsLibrary('geometry');
	const polygonsRef = useRef<google.maps.Polygon[]>([]);

	useEffect(() => {
		if (!map || !geometryLib) return;

		// Clear previous polygons
		polygonsRef.current.forEach((p) => p.setMap(null));
		polygonsRef.current = [];

		LUBLIN_DISTRICTS.forEach((district) => {
			const isSelected = district.id === selectedDistrictId;

			const polygon = new google.maps.Polygon({
				paths: district.polygon,
				strokeColor: district.color,
				strokeOpacity: isSelected ? 1 : 0.7,
				strokeWeight: isSelected ? 3 : 2,
				fillColor: district.color,
				fillOpacity: isSelected ? 0.35 : 0.15,
				map,
				zIndex: isSelected ? 10 : 1
			});

			polygon.addListener('click', () => {
				onDistrictClick(district);
			});

			polygon.addListener('mouseover', () => {
				if (district.id !== selectedDistrictId) {
					polygon.setOptions({ fillOpacity: 0.3, strokeWeight: 3 });
				}
			});

			polygon.addListener('mouseout', () => {
				if (district.id !== selectedDistrictId) {
					polygon.setOptions({ fillOpacity: 0.15, strokeWeight: 2 });
				}
			});

			polygonsRef.current.push(polygon);
		});

		return () => {
			polygonsRef.current.forEach((p) => p.setMap(null));
			polygonsRef.current = [];
		};
	}, [map, geometryLib, onDistrictClick, selectedDistrictId]);

	return null;
}

function DistrictMarkers({
	selectedDistrictId,
	onDistrictClick
}: {
	selectedDistrictId: string | null;
	onDistrictClick: (district: District) => void;
}) {
	const map = useMap();
	const overlaysRef = useRef<google.maps.OverlayView[]>([]);

	useEffect(() => {
		if (!map) return;

		overlaysRef.current.forEach((o) => o.setMap(null));
		overlaysRef.current = [];

		LUBLIN_DISTRICTS.forEach((district) => {
			const isSelected = district.id === selectedDistrictId;

			const container = document.createElement('div');
			container.style.cssText = `
				display: flex;
				align-items: center;
				gap: 6px;
				padding: 6px 12px;
				border-radius: 20px;
				background: ${isSelected ? district.color : 'white'};
				color: ${isSelected ? 'white' : '#1f2937'};
				font-size: 13px;
				font-weight: 600;
				font-family: Inter, sans-serif;
				box-shadow: 0 2px 8px rgba(0,0,0,0.15);
				border: 2px solid ${district.color};
				cursor: pointer;
				transition: transform 0.2s;
				white-space: nowrap;
				position: absolute;
				transform: translate(-50%, -50%);
			`;
			container.innerHTML = `
				<span style="font-size: 11px; background: ${isSelected ? 'rgba(255,255,255,0.25)' : district.color + '20'}; color: ${isSelected ? 'white' : district.color}; padding: 2px 6px; border-radius: 10px; font-weight: 700;">${district.employees.length}</span>
				${district.name}
			`;

			container.addEventListener('mouseenter', () => {
				container.style.transform = 'translate(-50%, -50%) scale(1.08)';
			});
			container.addEventListener('mouseleave', () => {
				container.style.transform = 'translate(-50%, -50%) scale(1)';
			});
			container.addEventListener('click', (e) => {
				e.stopPropagation();
				onDistrictClick(district);
			});

			const overlay = new google.maps.OverlayView();
			overlay.onAdd = function () {
				const panes = this.getPanes();
				panes?.overlayMouseTarget.appendChild(container);
			};
			overlay.draw = function () {
				const projection = this.getProjection();
				const pos = projection.fromLatLngToDivPixel(
					new google.maps.LatLng(district.center.lat, district.center.lng)
				);
				if (pos) {
					container.style.left = `${pos.x}px`;
					container.style.top = `${pos.y}px`;
				}
			};
			overlay.onRemove = function () {
				container.remove();
			};
			overlay.setMap(map);
			overlaysRef.current.push(overlay);
		});

		return () => {
			overlaysRef.current.forEach((o) => o.setMap(null));
			overlaysRef.current = [];
		};
	}, [map, selectedDistrictId, onDistrictClick]);

	return null;
}

function EmployeeListItem({
	employee,
	showIdentity
}: {
	employee: DistrictEmployee;
	showIdentity: boolean;
}) {
	const { t } = useTranslation();

	return (
		<div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
			<div className="h-10 w-10 rounded-full bg-dimmed-blue/20 flex items-center justify-center shrink-0">
				<UserRound className="w-5 h-5 text-primary-blue" />
			</div>
			<div className="flex-1 min-w-0">
				{showIdentity ? (
					<>
						<p className="text-sm font-medium text-gray-900 truncate">
							{employee.name}
						</p>
						<p className="text-xs text-grayed-out">{employee.role}</p>
					</>
				) : (
					<p className="text-sm font-medium text-gray-900 truncate">
						{employee.role}
					</p>
				)}
			</div>
			<span
				className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
					employee.available
						? 'bg-green-100 text-green-700'
						: 'bg-red-100 text-red-600'
				}`}>
				{employee.available
					? t('dashboard.available')
					: t('dashboard.unavailable')}
			</span>
		</div>
	);
}

function MapContent() {
	const { t } = useTranslation();
	const { auth } = useAuth();
	const { callWithToken } = useAuthenticatedApi();
	const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
		null
	);
	const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
	const [canViewEmployeeIdentity, setCanViewEmployeeIdentity] = useState(false);

	useEffect(() => {
		let isMounted = true;

		async function resolveIdentityVisibility() {
			if (!auth.user?.id) {
				setCanViewEmployeeIdentity(false);
				return;
			}

			if (auth.user.accountType === 'employer') {
				setCanViewEmployeeIdentity(true);
				return;
			}

			try {
				const [profileResult, userMeResult] = await Promise.allSettled([
					callWithToken(getMyProfile) as Promise<UserVerificationSnapshot>,
					callWithToken(getUserMe) as Promise<UserMeSnapshot>
				]);

				const profile =
					profileResult.status === 'fulfilled' ? profileResult.value : null;
				const userMe =
					userMeResult.status === 'fulfilled' ? userMeResult.value : null;
				const isVerified =
					profile?.is_verified === true ||
					profile?.verification_status === 'verified';
				const isOwner = userMe?.isOwner === true;

				if (isMounted) {
					setCanViewEmployeeIdentity(isVerified || isOwner);
				}
			} catch {
				if (isMounted) {
					setCanViewEmployeeIdentity(false);
				}
			}
		}

		resolveIdentityVisibility();

		return () => {
			isMounted = false;
		};
	}, [auth.user?.id, callWithToken]);

	const handleDistrictClick = useCallback((district: District) => {
		setSelectedDistrict(district);
		setCategoryFilter(null);
	}, []);

	const handleClose = useCallback(() => {
		setSelectedDistrict(null);
		setCategoryFilter(null);
	}, []);

	const filteredEmployees = selectedDistrict
		? categoryFilter
			? selectedDistrict.employees.filter((e) => e.category === categoryFilter)
			: selectedDistrict.employees
		: [];

	const categoryCountsInDistrict = selectedDistrict
		? selectedDistrict.employees.reduce(
				(acc, emp) => {
					acc[emp.category] = (acc[emp.category] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			)
		: {};

	const totalEmployees = ALL_EMPLOYEES.length;

	return (
		<>
			<DistrictPolygons
				onDistrictClick={handleDistrictClick}
				selectedDistrictId={selectedDistrict?.id ?? null}
			/>
			<DistrictMarkers
				onDistrictClick={handleDistrictClick}
				selectedDistrictId={selectedDistrict?.id ?? null}
			/>

			{/* Stats overlay */}
			<div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 z-10">
				<div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
					<Users size={16} className="text-primary-blue" />
					<span>
						{totalEmployees} {t('employeeMap.totalWorkers')}
					</span>
				</div>
				<p className="text-xs text-grayed-out mt-1">
					{LUBLIN_DISTRICTS.length} {t('employeeMap.districts')}
				</p>
			</div>

			{/* District detail panel */}
			{selectedDistrict && (
				<div className="absolute top-0 right-0 bottom-0 w-96 bg-white shadow-xl z-20 flex flex-col border-l border-base-border animate-in slide-in-from-right duration-300">
					{/* Header */}
					<div
						className="p-5 border-b border-base-border"
						style={{
							background: `linear-gradient(135deg, ${selectedDistrict.color}15, ${selectedDistrict.color}05)`
						}}>
						<div className="flex items-center justify-between mb-3">
							<button
								onClick={handleClose}
								className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
								<ChevronLeft size={18} />
							</button>
							<button
								onClick={handleClose}
								className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
								<X size={18} />
							</button>
						</div>

						<div className="flex items-center gap-3">
							<div
								className="h-10 w-10 rounded-xl flex items-center justify-center"
								style={{ backgroundColor: selectedDistrict.color + '20' }}>
								<MapPin size={20} style={{ color: selectedDistrict.color }} />
							</div>
							<div>
								<h2 className="text-lg font-bold text-gray-900">
									{selectedDistrict.name}
								</h2>
								<p className="text-sm text-grayed-out">
									{selectedDistrict.employees.length}{' '}
									{t('employeeMap.workersInDistrict')}
								</p>
							</div>
						</div>
					</div>

					{/* Category filter pills */}
					{Object.keys(categoryCountsInDistrict).length > 1 && (
						<div className="px-5 py-3 border-b border-base-border">
							<div className="flex flex-wrap gap-1.5">
								<button
									onClick={() => setCategoryFilter(null)}
									className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
										!categoryFilter
											? 'bg-primary-blue text-white'
											: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
									}`}>
									{t('dashboard.categories.all')} (
									{selectedDistrict.employees.length})
								</button>
								{(
									Object.entries(categoryCountsInDistrict) as [
										CategoryKey,
										number
									][]
								).map(([cat, count]) => (
									<button
										key={cat}
										onClick={() =>
											setCategoryFilter(categoryFilter === cat ? null : cat)
										}
										className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
											categoryFilter === cat
												? 'bg-primary-blue text-white'
												: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
										}`}>
										{t(
											`dashboard.categories.${cat}` as `dashboard.categories.construction`
										)}{' '}
										({count})
									</button>
								))}
							</div>
						</div>
					)}

					{/* Employee list */}
					<div className="flex-1 overflow-y-auto p-3">
						{filteredEmployees.length > 0 ? (
							<div className="space-y-1">
								{filteredEmployees.map((employee) => (
									<EmployeeListItem
										key={employee.id}
										employee={employee}
										showIdentity={canViewEmployeeIdentity}
									/>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center h-full text-grayed-out">
								<Users size={32} className="mb-2 opacity-50" />
								<p className="text-sm">{t('dashboard.noResults')}</p>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}

export default function EmployeeMap() {
	const { t } = useTranslation();

	if (!GOOGLE_MAPS_API_KEY) {
		return (
			<BaseContentWrapper className="px-8">
				<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
					<MapPin size={48} className="text-grayed-out mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						{t('employeeMap.apiKeyMissing')}
					</h2>
					<p className="text-sm text-grayed-out max-w-md">
						{t('employeeMap.apiKeyMissingDesc')}
					</p>
					<code className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
						VITE_GOOGLE_MAPS_API_KEY=your_key_here
					</code>
				</div>
			</BaseContentWrapper>
		);
	}

	return (
		<APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
			<div className="h-[calc(100vh-64px)] mt-[64px] w-full relative">
				<Map
					defaultCenter={LUBLIN_CENTER}
					defaultZoom={DEFAULT_ZOOM}
					gestureHandling="greedy"
					disableDefaultUI={false}
					zoomControl
					streetViewControl={false}
					mapTypeControl={false}
					fullscreenControl={false}
					styles={[
						{
							featureType: 'poi',
							stylers: [{ visibility: 'off' }]
						},
						{
							featureType: 'transit',
							stylers: [{ visibility: 'off' }]
						}
					]}>
					<MapContent />
				</Map>
			</div>
		</APIProvider>
	);
}
