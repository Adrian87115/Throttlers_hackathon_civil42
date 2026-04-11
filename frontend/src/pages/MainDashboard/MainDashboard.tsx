import BorderGlow from '@/components/Animated/BorderGlow';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { useAuth } from '@/contexts/AuthUserContext';
import envConfig from '@/types/envConfig';
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
import { LUBLIN_DISTRICTS } from '../EmployeeMap/districts';
import EmployeeCard, { type CategoryKey, type Employee } from './EmployeeCard';

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
	employeeRole
}: {
	employeeName: string;
	employeeRole: string;
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

		// Label overlay
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
		container.innerHTML = `
			<div style="font-size: 13px; font-weight: 600; color: #111827;">${employeeName}</div>
			<div style="font-size: 11px; color: #6b7280;">${employeeRole}</div>
		`;

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
	}, [map, geometryLib, employeeName, employeeRole]);

	return null;
}

function EmployeeMapPopup({
	employee,
	open,
	onOpenChange
}: {
	employee: Employee;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation();
	const isLublin = employee.location.toLowerCase() === 'lublin';
	const district = isLublin ? findDistrictByEmployee(employee.name) : null;
	const coords = district?.center || CITY_COORDS[employee.location.toLowerCase()];
	const fallback = { lat: 51.9194, lng: 19.1451 };

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-150! p-0 overflow-hidden bg-white">
				<DialogHeader className="px-6 pt-6 pb-0">
					<DialogTitle className="flex items-center gap-2 text-gray-900">
						<MapPin size={18} className="text-primary-blue" />
						{employee.name} — {employee.location}
					</DialogTitle>
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
								{isLublin && <DistrictPolygon employeeName={employee.name} employeeRole={employee.role} />}
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

// placeholder data — replace with API call
const MOCK_EMPLOYEES: Employee[] = [
	{
		id: '1',
		name: 'Anna Kowalska',
		role: 'Frontend Developer',
		category: 'technology',
		location: 'Lublin',
		experience: 5,
		available: true
	},
	{
		id: '2',
		name: 'Jan Nowak',
		role: 'Murarz',
		category: 'construction',
		location: 'Kraków',
		experience: 12,
		available: true
	},
	{
		id: '3',
		name: 'Maria Wiśniewska',
		role: 'Pielęgniarka',
		category: 'healthcare',
		location: 'Gdańsk',
		experience: 8,
		available: false
	},
	{
		id: '4',
		name: 'Piotr Zieliński',
		role: 'Mechanik samochodowy',
		category: 'automotive',
		location: 'Wrocław',
		experience: 15,
		available: true
	},
	{
		id: '5',
		name: 'Katarzyna Lewandowska',
		role: 'Nauczycielka',
		category: 'education',
		location: 'Poznań',
		experience: 10,
		available: true
	},
	{
		id: '6',
		name: 'Tomasz Kamiński',
		role: 'Rolnik',
		category: 'agriculture',
		location: 'Lublin',
		experience: 20,
		available: true
	},
	{
		id: '7',
		name: 'Marek Wójcik',
		role: 'Elektryk',
		category: 'construction',
		location: 'Katowice',
		experience: 7,
		available: false
	},
	{
		id: '8',
		name: 'Ewa Szymańska',
		role: 'Kucharz',
		category: 'gastronomy',
		location: 'Lublin',
		experience: 6,
		available: true
	},
	{
		id: '9',
		name: 'Andrzej Dąbrowski',
		role: 'Kierowca TIR',
		category: 'transport',
		location: 'Łódź',
		experience: 14,
		available: true
	},
	{
		id: '10',
		name: 'Zofia Mazur',
		role: 'Sprzedawca',
		category: 'trade',
		location: 'Szczecin',
		experience: 3,
		available: true
	},
	{
		id: '11',
		name: 'Krzysztof Jankowski',
		role: 'Hydraulik',
		category: 'services',
		location: 'Bydgoszcz',
		experience: 11,
		available: true
	},
	{
		id: '12',
		name: 'Agnieszka Wojciechowska',
		role: 'Ogrodnik',
		category: 'agriculture',
		location: 'Rzeszów',
		experience: 9,
		available: false
	}
];

export default function MainDashboard() {
	const { t } = useTranslation();
	const { getUser } = useAuth();
	const user = getUser();

	const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(
		null
	);
	const [searchQuery, setSearchQuery] = useState('');
	const [mapEmployee, setMapEmployee] = useState<Employee | null>(null);

	const employeesInCategory = selectedCategory
		? MOCK_EMPLOYEES.filter((emp) => emp.category === selectedCategory)
		: [];

	const filteredEmployees = employeesInCategory.filter(
		(emp) =>
			searchQuery === '' ||
			emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
			emp.location.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const getEmployeeCount = (cat: CategoryKey) =>
		MOCK_EMPLOYEES.filter((emp) => emp.category === cat).length;

	const getTotalEmployeeCount = () => MOCK_EMPLOYEES.length;

	// Category tile view
	if (!selectedCategory) {
		return (
			<BaseContentWrapper className="px-8">
				<section className="mb-10">
					<h1 className="text-3xl font-bold text-gray-900">
						{t('dashboard.greeting', {
							employeeCount: getTotalEmployeeCount(),
							name: user?.nickname || ''
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
							<button
								key={cat}
								onClick={() => setSelectedCategory(cat)}
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
												{count === 1 ? 'osoba' : count < 5 ? 'osoby' : 'osób'}
											</span>
										</div>
									</div>
								</BorderGlow>
							</button>
						);
					})}
				</div>
			</BaseContentWrapper>
		);
	}

	// Employee list view for selected category
	const style = CATEGORY_STYLES[selectedCategory];

	return (
		<BaseContentWrapper className="px-8">
			{/* Back button + category header */}
			<section className="mb-8">
				<button
					onClick={() => {
						setSelectedCategory(null);
						setSearchQuery('');
					}}
					className="flex items-center gap-2 text-sm text-primary-blue hover:opacity-80 transition-opacity mb-4">
					<ArrowLeft size={16} />
					{t('dashboard.backToCategories')}
				</button>

				<div className="flex items-center gap-4">
					<div
						className={`h-12 w-12 rounded-xl flex items-center justify-center ${style.text}`}
						style={{ backgroundColor: style.bg }}>
						{CATEGORY_ICONS[selectedCategory]}
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							{t(`dashboard.categories.${selectedCategory}` as const)}
						</h1>
						<p className="text-sm text-base-muted-foreground">
							{filteredEmployees.length}{' '}
							{filteredEmployees.length === 1
								? 'osoba'
								: filteredEmployees.length < 5
									? 'osoby'
									: 'osób'}
						</p>
					</div>
				</div>
			</section>

			{/* Search */}
			<section className="mb-6">
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder={t('dashboard.searchPlaceholder')}
					className="w-full max-w-md px-4 py-2 rounded-lg border border-base-border bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-colors"
				/>
			</section>

			{/* Employee grid */}
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
				/>
			)}
		</BaseContentWrapper>
	);
}
