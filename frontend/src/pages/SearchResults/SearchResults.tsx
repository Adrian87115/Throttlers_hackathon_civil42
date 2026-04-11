import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthUserContext';
import { ALL_EMPLOYEES } from '@/data/employees';
import envConfig from '@/types/envConfig';
import {
	APIProvider,
	Map,
	useMap,
	useMapsLibrary
} from '@vis.gl/react-google-maps';
import { MapPin, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { LUBLIN_DISTRICTS } from '../EmployeeMap/districts';
import EmployeeCard, {
	type CategoryKey,
	type Employee
} from '../MainDashboard/EmployeeCard';

const GOOGLE_MAPS_API_KEY = envConfig.googlemaps.token || '';

const CATEGORY_IMAGES: Record<CategoryKey, string> = {
	construction:
		'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80',
	agriculture:
		'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80',
	automotive:
		'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&q=80',
	technology:
		'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
	healthcare:
		'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1200&q=80',
	education:
		'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
	gastronomy:
		'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=80',
	trade:
		'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
	transport:
		'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=80',
	services:
		'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80'
};

// Approximate coordinates for Polish cities used in mock data
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

const MOCK_EMPLOYEES = ALL_EMPLOYEES;

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
	const fallback = { lat: 51.9194, lng: 19.1451 }; // center of Poland

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-150! p-0 overflow-hidden bg-white">
				<DialogHeader className="px-6 pt-6 pb-0">
					<DialogTitle className="flex items-center gap-2 text-gray-900">
						<MapPin size={18} className="text-primary-blue" />
					{isAuthenticated ? employee.name : employee.role} — {employee.location}
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
								{isLublin && (
									<DistrictPolygon
										employeeName={employee.name}
										employeeRole={employee.role}
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

export default function SearchResults() {
	const { t } = useTranslation();
	const { auth } = useAuth();
	const isAuthenticated = auth.user !== null;
	const [searchParams] = useSearchParams();
	const query = searchParams.get('q')?.trim() || '';
	const [mapEmployee, setMapEmployee] = useState<Employee | null>(null);

	const results = query
		? MOCK_EMPLOYEES.filter(
				(emp) =>
					emp.name.toLowerCase().includes(query.toLowerCase()) ||
					emp.role.toLowerCase().includes(query.toLowerCase()) ||
					emp.location.toLowerCase().includes(query.toLowerCase()) ||
					t(`dashboard.categories.${emp.category}` as const)
						.toLowerCase()
						.includes(query.toLowerCase())
			)
		: [];

	// Group results by category
	const grouped = results.reduce(
		(acc, emp) => {
			if (!acc[emp.category]) acc[emp.category] = [];
			acc[emp.category].push(emp);
			return acc;
		},
		{} as Record<CategoryKey, Employee[]>
	);

	const categoryOrder = Object.keys(grouped) as CategoryKey[];

	return (
		<BaseContentWrapper className="px-8">
			<section className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900">
					{t('search.title')}
				</h1>
				{query ? (
					<p className="text-base-muted-foreground mt-1">
						{t('search.resultsFor', { query })}
					</p>
				) : (
					<p className="text-base-muted-foreground mt-1">
						{t('search.noQuery')}
					</p>
				)}
			</section>

			{query && results.length > 0 ? (
				<div className="space-y-10">
					{categoryOrder.map((category) => (
						<section key={category}>
							{/* Category banner */}
							<div className="relative w-full h-42 rounded-xl overflow-hidden mb-5">
								<img
									src={CATEGORY_IMAGES[category]}
									alt={t(`dashboard.categories.${category}` as const)}
									className="absolute inset-0 w-full h-full object-cover"
								/>
								<div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent" />
								<div className="relative h-full flex items-center px-6 gap-3">
									<h2 className="text-xl font-bold text-white">
										{t(`dashboard.categories.${category}` as const)}
									</h2>
									<span className="text-sm text-white/70">
										({grouped[category].length})
									</span>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
								{grouped[category].map((employee) => (
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
						</section>
					))}
				</div>
			) : query ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<Search size={48} className="text-gray-300 mb-4" />
					<p className="text-lg font-medium text-gray-600">
						{t('search.noResults', { query })}
					</p>
					<p className="text-sm text-base-muted-foreground mt-1">
						{t('search.tryDifferent')}
					</p>
				</div>
			) : null}

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
