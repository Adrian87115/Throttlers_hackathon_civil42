import BaseButton from '@/components/Buttons/BaseButton';
import CopyableText from '@/components/CopyableText/CopyableText';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { ALL_EMPLOYEES } from '@/data/employees';
import { LUBLIN_DISTRICTS } from '@/pages/EmployeeMap/districts';
import envConfig from '@/types/envConfig';
import {
	APIProvider,
	Map,
	useMap,
	useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
	AlertTriangle,
	ArrowLeft,
	Briefcase,
	Mail,
	MapPin,
	Phone,
	UserRound
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

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

export default function EmployeeProfile() {
	const { id } = useParams<{ id: string }>();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const employee = ALL_EMPLOYEES.find((emp) => emp.id === id);

	if (!employee) {
		return (
			<BaseContentWrapper className="px-8 py-10 text-center">
				<h1 className="text-2xl font-bold mb-4">{t('dashboard.noResults')}</h1>
				<BaseButton onClick={() => navigate(-1)} variant="outlined">
					{t('dashboard.backToCategories') || 'Back'}
				</BaseButton>
			</BaseContentWrapper>
		);
	}

	const isLublin = employee.location.toLowerCase() === 'lublin';
	const district = isLublin ? findDistrictByEmployee(employee.name) : null;
	const mockPhone = `+48 500 123 ${employee.id.replace(/\D/g, '').padStart(3, '0')}`;

	return (
		<BaseContentWrapper className="px-8 max-w-4xl mx-auto py-10">
			<button
				onClick={() => navigate(-1)}
				className="flex items-center gap-2 text-base-muted-foreground hover:text-gray-900 mb-8 transition-colors">
				<ArrowLeft size={16} />
				{t('dashboard.backToCategories') || 'Back'}
			</button>

			<div className="bg-white rounded-2xl border border-base-border p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
				<div className="shrink-0 flex flex-col items-center">
					{employee.avatarUrl ? (
						<img
							src={employee.avatarUrl}
							alt={employee.name}
							className="h-32 w-32 rounded-full object-cover shadow-sm bg-gray-50"
						/>
					) : (
						<div className="h-32 w-32 rounded-full bg-dimmed-blue/30 flex flex-col items-center justify-center shadow-sm">
							<UserRound className="w-12 h-12 text-primary-blue" />
						</div>
					)}
					<span
						className={`mt-4 text-sm font-medium px-3 py-1 rounded-full ${
							employee.available
								? 'bg-green-100 text-green-700'
								: 'bg-red-100 text-red-600'
						}`}>
						{employee.available
							? t('dashboard.available')
							: t('dashboard.unavailable')}
					</span>
				</div>

				<div className="flex-1">
					<h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
					<p className="text-lg text-primary-blue mt-1">
						{t(`dashboard.categories.${employee.category}` as const)} •{' '}
						{employee.role}
					</p>

					<div className="grid grid-cols-1 gap-4 mt-6">
						<div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
							<MapPin size={18} className="text-gray-400" />
							<span className="truncate">
								{employee.location}
								{isLublin && district ? `, ${district.name}` : ''}
							</span>
						</div>
						<div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
							<Briefcase size={18} className="text-gray-400" />
							<span>
								{t('dashboard.experienceYears', { count: employee.experience })}
							</span>
						</div>
						<div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
							<Mail size={18} className="text-gray-400" />
							<CopyableText
								copyValue={
									employee.name.toLowerCase().replace(/\s+/g, '.') +
									'@example.com'
								}
							/>
						</div>
						<div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
							<Phone size={18} className="text-gray-400" />
							<span>{mockPhone}</span>
						</div>
					</div>

					<div className="mt-8 pt-8 border-t border-gray-100">
						<h2 className="text-xl font-semibold mb-4 text-gray-900">
							{t('profile.about', 'O pracowniku')}
						</h2>
						<p className="text-gray-600 leading-relaxed">
							{employee.name} to doświadczony specjalista w branży{' '}
							{t(
								`dashboard.categories.${employee.category}` as const
							).toLowerCase()}
							, gotowy do podjęcia nowych wyzwań. Może pochwalić się{' '}
							{employee.experience}-letnim doświadczeniem zdobytym przy
							różnorodnych projektach.
						</p>
					</div>

					<div className="mt-8 pt-8 border-t border-gray-100">
						<div className="flex items-center gap-2 mb-4">
							<AlertTriangle className="text-red-500" size={20} />
							<h2 className="text-xl font-semibold text-gray-900">
								Wyposażenie awaryjne{' '}
								<span className="text-sm font-normal text-gray-500 ml-1">
									(Sytuacje kryzysowe)
								</span>
							</h2>
						</div>
						<p className="text-sm text-gray-600 mb-4">
							Sprzęt zadeklarowany do udostępnienia dla służb publicznych w
							sytuacjach kryzysowych.
						</p>
						<div className="flex flex-wrap gap-2">
							{employee.category === 'construction' ||
							employee.category === 'agriculture' ? (
								<>
									<span className="bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium">
										Koparka gąsienicowa
									</span>
									<span className="bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium">
										Agregat prądotwórczy 10kW
									</span>
								</>
							) : employee.category === 'transport' ? (
								<>
									<span className="bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium">
										Pojazd ciężarowy (HDS)
									</span>
									<span className="bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium">
										Zestaw pasów transportowych
									</span>
								</>
							) : (
								<>
									<span className="bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium">
										Samochód dostawczy do 3.5t
									</span>
									<span className="bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-medium">
										Podstawowy sprzęt ratunkowy
									</span>
								</>
							)}
						</div>
					</div>

					<div className="mt-8 flex gap-4">
						<BaseButton
							onClick={() => alert('Wiadomość wysłana')}
							className="flex-1 md:flex-none">
							Skontaktuj się
						</BaseButton>
					</div>
				</div>
			</div>

			{/* Embedded map */}
			<div className="mt-8 bg-white rounded-2xl border border-base-border overflow-hidden shadow-sm">
				<div className="px-6 py-4 border-b border-base-border flex items-center gap-2">
					<MapPin size={18} className="text-primary-blue" />
					<h2 className="text-lg font-semibold text-gray-900">
						{t('profile.location', 'Lokalizacja')} — {employee.location}
					</h2>
				</div>
				<div className="h-96 w-full">
					{GOOGLE_MAPS_API_KEY ? (
						<APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
							<Map
								defaultCenter={
									district?.center ||
									CITY_COORDS[employee.location.toLowerCase()] || {
										lat: 51.9194,
										lng: 19.1451
									}
								}
								defaultZoom={isLublin ? 13 : 12}
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
							{t('employeeMap.apiKeyMissing', 'Brak klucza API Google Maps')}
						</div>
					)}
				</div>
			</div>
		</BaseContentWrapper>
	);
}
