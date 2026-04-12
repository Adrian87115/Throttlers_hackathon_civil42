import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { useAuth } from '@/contexts/AuthUserContext';
import { ALL_EMPLOYEES } from '@/data/employees';
import envConfig from '@/types/envConfig';
import { AppRoutePaths } from '@/types/types';
import { DialogDescription } from '@radix-ui/react-dialog';
import {
	APIProvider,
	Map,
	useMap,
	useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
	ArrowLeft,
	Car,
	GraduationCap,
	HardHat,
	HeartPulse,
	Laptop,
	MapPin,
	ShoppingCart,
	Tractor,
	Truck,
	UtensilsCrossed,
	Wrench
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router-dom';
import { LUBLIN_DISTRICTS } from '../EmployeeMap/districts';
import EmployeeCard, {
	type CategoryKey,
	type Employee
} from '../MainDashboard/EmployeeCard';

const VALID_CATEGORIES: CategoryKey[] = [
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
	{ bg: string; text: string; image: string }
> = {
	construction: {
		bg: '#1a1207',
		text: 'text-amber-400',
		image:
			'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80'
	},
	agriculture: {
		bg: '#071a0b',
		text: 'text-green-400',
		image:
			'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&q=80'
	},
	automotive: {
		bg: '#0f0d1a',
		text: 'text-violet-400',
		image:
			'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80'
	},
	technology: {
		bg: '#071219',
		text: 'text-cyan-400',
		image:
			'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80'
	},
	healthcare: {
		bg: '#1a070e',
		text: 'text-rose-400',
		image:
			'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&q=80'
	},
	education: {
		bg: '#0d1419',
		text: 'text-blue-400',
		image:
			'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80'
	},
	gastronomy: {
		bg: '#1a0f07',
		text: 'text-orange-400',
		image:
			'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=80'
	},
	trade: {
		bg: '#12071a',
		text: 'text-purple-400',
		image:
			'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80'
	},
	transport: {
		bg: '#07141a',
		text: 'text-teal-400',
		image:
			'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&q=80'
	},
	services: {
		bg: '#141007',
		text: 'text-yellow-400',
		image:
			'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80'
	}
};

const GOOGLE_MAPS_API_KEY = envConfig.googlemaps.token || '';

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
	lublin: { lat: 51.2465, lng: 22.5685 },
	kraków: { lat: 50.0647, lng: 19.945 },
	gdańsk: { lat: 54.352, lng: 18.6466 },
	wrocław: { lat: 51.1079, lng: 17.0385 },
	poznań: { lat: 52.4064, lng: 16.9252 },
	katowice: { lat: 50.2649, lng: 19.0238 },
	łódź: { lat: 51.7592, lng: 19.456 },
	szczecin: { lat: 53.4285, lng: 14.5528 },
	bydgoszcz: { lat: 53.1235, lng: 18.0084 },
	rzeszów: { lat: 50.0412, lng: 21.999 }
};

function findDistrictByEmployee(employeeName: string) {
	return LUBLIN_DISTRICTS.find((d) =>
		d.employees.some((e) => e.name === employeeName)
	);
}

function DistrictPolygon({
	employeeName,
	employeeRole,
	isAuthenticated
}: {
	employeeName: string;
	employeeRole: string;
	isAuthenticated: boolean;
}) {
	const map = useMap();
	const geometryLib = useMapsLibrary('geometry');
	const polygonRef = useRef<google.maps.Polygon | null>(null);
	const overlayRef = useRef<google.maps.OverlayView | null>(null);

	useEffect(() => {
		if (!map || !geometryLib) return;

		polygonRef.current?.setMap(null);
		polygonRef.current = null;
		overlayRef.current?.setMap(null);
		overlayRef.current = null;

		const district = findDistrictByEmployee(employeeName);
		if (!district) return;

		const polygon = new google.maps.Polygon({
			paths: district.polygon,
			strokeColor: district.color,
			strokeOpacity: 1,
			strokeWeight: 3,
			fillColor: district.color,
			fillOpacity: 0.25,
			map
		});
		polygonRef.current = polygon;

		const container = document.createElement('div');
		container.style.cssText = `
			position: absolute;
			transform: translate(-50%, -100%);
			padding: 6px 12px;
			border-radius: 8px;
			background: white;
			box-shadow: 0 2px 8px rgba(0,0,0,0.18);
			border-left: 3px solid ${district.color};
			white-space: nowrap;
			pointer-events: none;
			font-family: Inter, sans-serif;
		`;
		container.innerHTML = isAuthenticated
			? `
				<div style="font-size: 13px; font-weight: 600; color: #111827;">${employeeName}</div>
				<div style="font-size: 11px; color: #6b7280;">${employeeRole}</div>
			`
			: `<div style="font-size: 11px; color: #6b7280;">${employeeRole}</div>`;

		const overlay = new google.maps.OverlayView();
		overlay.onAdd = function () {
			this.getPanes()?.overlayMouseTarget.appendChild(container);
		};
		overlay.draw = function () {
			const projection = this.getProjection();
			const pos = projection.fromLatLngToDivPixel(
				new google.maps.LatLng(district.center.lat, district.center.lng)
			);
			if (pos) {
				container.style.left = `${pos.x}px`;
				container.style.top = `${pos.y - 4}px`;
			}
		};
		overlay.onRemove = function () {
			container.remove();
		};
		overlay.setMap(map);
		overlayRef.current = overlay;

		return () => {
			polygonRef.current?.setMap(null);
			polygonRef.current = null;
			overlayRef.current?.setMap(null);
			overlayRef.current = null;
		};
	}, [map, geometryLib, employeeName, employeeRole, isAuthenticated]);

	return null;
}

function EmployeeMapPopup({
	employee,
	open,
	onOpenChange,
	isAuthenticated
}: {
	employee: Employee;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isAuthenticated: boolean;
}) {
	const { t } = useTranslation();
	const isLublin = employee.location.toLowerCase() === 'lublin';
	const district = isLublin ? findDistrictByEmployee(employee.name) : null;
	const coords =
		district?.center || CITY_COORDS[employee.location.toLowerCase()];
	const fallback = { lat: 51.9194, lng: 19.1451 };

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-150! p-0 overflow-hidden bg-white">
				<DialogHeader className="px-6 pt-6 pb-0">
					<DialogTitle className="flex items-center gap-2 text-gray-900">
						<MapPin size={18} className="text-primary-blue" />
						{isAuthenticated ? employee.name : employee.role} —{' '}
						{employee.location}
					</DialogTitle>
					{district && (
						<DialogDescription className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
							<MapPin size={12} className="text-gray-400 shrink-0" />
							Dzielnica:{' '}
							<span className="font-medium text-gray-700 ml-1">
								{district.name}
							</span>
						</DialogDescription>
					)}
				</DialogHeader>
				<div className="h-100 w-full">
					{GOOGLE_MAPS_API_KEY ? (
						<APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
							<Map
								defaultCenter={coords || fallback}
								defaultZoom={isLublin ? 12 : coords ? 12 : 6}
								gestureHandling="greedy"
								disableDefaultUI={false}
								zoomControl
								streetViewControl={false}
								mapTypeControl={false}
								fullscreenControl={false}>
								{isLublin && (
									<DistrictPolygon
										employeeName={employee.name}
										employeeRole={employee.role}
										isAuthenticated={isAuthenticated}
									/>
								)}
							</Map>
						</APIProvider>
					) : (
						<div className="flex items-center justify-center h-full bg-gray-100 text-grayed-out text-sm">
							{t('employeeMap.apiKeyMissing')}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default function CategoryDetail() {
	const { t } = useTranslation();
	const { auth } = useAuth();
	const isAuthenticated = auth.user !== null;
	const { category } = useParams<{ category: string }>();
	const [searchQuery, setSearchQuery] = useState('');
	const [mapEmployee, setMapEmployee] = useState<Employee | null>(null);

	if (!category || !VALID_CATEGORIES.includes(category as CategoryKey)) {
		return <Navigate to="/not-found" replace />;
	}

	const selectedCategory = category as CategoryKey;
	const style = CATEGORY_STYLES[selectedCategory];

	const employeesInCategory = ALL_EMPLOYEES.filter(
		(emp) => emp.category === selectedCategory
	);

	const filteredEmployees = employeesInCategory.filter(
		(emp) =>
			searchQuery === '' ||
			emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
			emp.location.toLowerCase().includes(searchQuery.toLowerCase())
	);

	useEffect(() => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	}, []);

	return (
		<BaseContentWrapper className="px-8">
			<section className="mb-8">
				<Link
					to={AppRoutePaths.employees()}
					className="flex items-center gap-2 text-sm text-primary-blue hover:opacity-80 transition-opacity mb-4">
					<ArrowLeft size={16} />
					{t('dashboard.backToCategories')}
				</Link>

				<div className="relative w-full h-42 rounded-xl overflow-hidden">
					<img
						src={style.image}
						alt={t(`dashboard.categories.${selectedCategory}` as const)}
						className="absolute inset-0 w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent" />
					<div className="relative h-full flex items-center px-6 gap-4">
						<div className={`${style.text} drop-shadow-lg`}>
							{CATEGORY_ICONS[selectedCategory]}
						</div>
						<div>
							<h1 className="text-2xl font-bold text-white drop-shadow-md">
								{t(`dashboard.categories.${selectedCategory}` as const)}
							</h1>
							<span className="text-sm text-white/70">
								{filteredEmployees.length}{' '}
								{filteredEmployees.length === 1
									? 'osoba'
									: filteredEmployees.length < 5
										? 'osoby'
										: 'osób'}
							</span>
						</div>
					</div>
				</div>
			</section>

			<section className="mb-6">
				{!isAuthenticated && (
					<div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
						Aby przegladac profile oraz szczegolowe informacje o osobach,
						zaloguj sie.
						<Link
							to={AppRoutePaths.loginPage()}
							className="ml-2 inline-flex font-semibold text-amber-900 underline underline-offset-2 hover:opacity-80">
							Przejdz do logowania
						</Link>
					</div>
				)}
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder={t('dashboard.searchPlaceholder')}
					className="w-full max-w-md px-4 py-2 rounded-lg border border-base-border bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-colors"
				/>
			</section>

			<section>
				{filteredEmployees.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{filteredEmployees.map((employee) => (
							<div key={employee.id} className="flex flex-col">
								<EmployeeCard employee={employee} />
								<button
									onClick={() => setMapEmployee(employee)}
									className="mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-base-border text-sm font-medium text-gray-600 hover:text-primary-blue hover:border-primary-blue hover:bg-primary-blue/5 transition-colors cursor-pointer">
									<MapPin size={14} />
									{t('search.showOnMap')}
								</button>
							</div>
						))}
					</div>
				) : (
					<p className="text-center text-base-muted-foreground py-12">
						{t('dashboard.noResults')}
					</p>
				)}
			</section>

			{mapEmployee && (
				<EmployeeMapPopup
					employee={mapEmployee}
					open={!!mapEmployee}
					onOpenChange={(open) => {
						if (!open) setMapEmployee(null);
					}}
					isAuthenticated={isAuthenticated}
				/>
			)}
		</BaseContentWrapper>
	);
}
