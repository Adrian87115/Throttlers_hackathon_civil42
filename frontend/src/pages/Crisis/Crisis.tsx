import BaseDimmedBackground from '@/components/BaseDimmedBackground/BaseDimmedBackground';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { useAuth } from '@/contexts/AuthUserContext';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { getMyProfile } from '@/services/auth';
import type { CrisisData, CrisisResponder } from '@/services/crisis';
import {
	getActiveCrisis,
	getCrisisResponders,
	postCrisisNotify,
	postCrisisRequest,
	postEndCrisis,
	postStartCrisis
} from '@/services/crisis';
import envConfig from '@/types/envConfig';
import {
	APIProvider,
	Map,
	useMap,
	useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
	AlertTriangle,
	Bell,
	ChevronLeft,
	Loader2,
	MapPin,
	Plus,
	ShieldAlert,
	ShieldOff,
	UserRound,
	Users,
	X
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { District } from '../EmployeeMap/districts';
import { LUBLIN_DISTRICTS } from '../EmployeeMap/districts';

const GOOGLE_MAPS_API_KEY = envConfig.googlemaps.token || '';
const LUBLIN_CENTER = { lat: 51.2465, lng: 22.5685 };
const CRISIS_STATUS_EVENT = 'crisis-status-changed';

function emitCrisisStatus(active: boolean) {
	window.dispatchEvent(
		new CustomEvent(CRISIS_STATUS_EVENT, { detail: { active } })
	);
}

function buildReadonlyGuestCrisis(): CrisisData {
	return {
		id: -1,
		title: 'Publiczny podglad sytuacji kryzysowej',
		description:
			'Mapa prezentuje dzielnice objete zgloszeniami kryzysowymi w trybie tylko do odczytu.',
		severity: 'high',
		started_at: new Date().toISOString(),
		affected_districts: LUBLIN_DISTRICTS.map((district) => district.id),
		status: 'active',
		created_by: 'system'
	};
}

type CrisisViewerProfile = {
	account_type?: string;
	is_government_service?: boolean;
	institution_type?: string;
};

/* ------------------------------------------------------------------ */
/*  No-crisis state                                                   */
/* ------------------------------------------------------------------ */

function NoCrisisView({ onStart }: { onStart: () => void }) {
	return (
		<BaseContentWrapper className="px-8 py-10">
			<div className="max-w-2xl mx-auto flex flex-col items-center text-center space-y-8">
				<div className="h-28 w-28 rounded-full bg-emerald-50 flex items-center justify-center">
					<ShieldAlert size={48} className="text-emerald-500" />
				</div>

				<div className="space-y-3">
					<h1 className="text-3xl font-bold text-gray-900">
						Brak aktywnego kryzysu
					</h1>
					<p className="text-gray-500 max-w-md mx-auto leading-relaxed">
						Aktualnie nie ma żadnej sytuacji kryzysowej w regionie. System
						monitoruje stan gotowości wolontariuszy i służb.
					</p>
				</div>

				<BaseDimmedBackground className="w-full text-left">
					<div className="flex items-start gap-4">
						<div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
							<Users size={20} className="text-primary-blue" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-900">
								Gotowość wolontariuszy
							</p>
							<p className="text-xs text-gray-500 mt-1">
								{LUBLIN_DISTRICTS.reduce(
									(sum, d) =>
										sum + d.employees.filter((e) => e.available).length,
									0
								)}{' '}
								dostępnych pracowników i wolontariuszy w{' '}
								{LUBLIN_DISTRICTS.length} dzielnicach
							</p>
						</div>
					</div>
				</BaseDimmedBackground>

				<button
					onClick={onStart}
					className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 cursor-pointer">
					<AlertTriangle size={20} />
					Ogłoś sytuację kryzysową
				</button>
				<p className="text-xs text-gray-400 -mt-4">
					Spowoduje powiadomienie wszystkich wolontariuszy i służb
				</p>
			</div>
		</BaseContentWrapper>
	);
}

/* ------------------------------------------------------------------ */
/*  Start crisis modal                                                */
/* ------------------------------------------------------------------ */

function StartCrisisModal({
	onClose,
	onSubmit,
	submitting
}: {
	onClose: () => void;
	onSubmit: (data: {
		title: string;
		description: string;
		severity: 'high' | 'critical';
		affected_districts: string[];
	}) => void;
	submitting: boolean;
}) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [severity, setSeverity] = useState<'high' | 'critical'>('high');
	const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

	function toggleDistrict(id: string) {
		setSelectedDistricts((prev) =>
			prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
		);
	}

	function handleSubmit() {
		if (!title.trim() || !description.trim() || selectedDistricts.length === 0)
			return;
		onSubmit({
			title: title.trim(),
			description: description.trim(),
			severity,
			affected_districts: selectedDistricts
		});
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
				<div className="p-6 border-b border-gray-100 flex items-center justify-between">
					<h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
						<AlertTriangle size={22} className="text-red-500" />
						Ogłoś kryzys
					</h2>
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 cursor-pointer">
						<X size={20} />
					</button>
				</div>

				<div className="p-6 space-y-5">
					<div>
						<label className="text-sm font-medium text-gray-700 block mb-1.5">
							Tytuł
						</label>
						<input
							className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-primary-blue focus:bg-white transition-colors"
							placeholder="np. Powódź - Lublin Wschód"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>

					<div>
						<label className="text-sm font-medium text-gray-700 block mb-1.5">
							Opis sytuacji
						</label>
						<textarea
							className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-blue focus:bg-white transition-colors resize-none min-h-[100px]"
							placeholder="Opisz sytuację kryzysową..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
						/>
					</div>

					<div>
						<label className="text-sm font-medium text-gray-700 block mb-2">
							Poziom zagrożenia
						</label>
						<div className="flex gap-3">
							<button
								onClick={() => setSeverity('high')}
								className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors cursor-pointer ${
									severity === 'high'
										? 'border-orange-400 bg-orange-50 text-orange-700'
										: 'border-gray-200 text-gray-500 hover:border-gray-300'
								}`}>
								Wysokie
							</button>
							<button
								onClick={() => setSeverity('critical')}
								className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors cursor-pointer ${
									severity === 'critical'
										? 'border-red-400 bg-red-50 text-red-700'
										: 'border-gray-200 text-gray-500 hover:border-gray-300'
								}`}>
								Krytyczne
							</button>
						</div>
					</div>

					<div>
						<label className="text-sm font-medium text-gray-700 block mb-2">
							Dotknięte dzielnice
						</label>
						<div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto">
							{LUBLIN_DISTRICTS.map((d) => (
								<button
									key={d.id}
									onClick={() => toggleDistrict(d.id)}
									className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer text-left ${
										selectedDistricts.includes(d.id)
											? 'border-primary-blue bg-primary-blue/10 text-primary-blue'
											: 'border-gray-200 text-gray-600 hover:border-gray-300'
									}`}>
									{d.name}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="p-6 border-t border-gray-100 flex justify-end gap-3">
					<button
						onClick={onClose}
						disabled={submitting}
						className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
						Anuluj
					</button>
					<button
						onClick={handleSubmit}
						disabled={
							submitting ||
							!title.trim() ||
							!description.trim() ||
							selectedDistricts.length === 0
						}
						className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50">
						{submitting ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<AlertTriangle size={16} />
						)}
						Ogłoś kryzys
					</button>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Add request modal (for a specific district)                       */
/* ------------------------------------------------------------------ */

const CATEGORY_OPTIONS = [
	{ value: 'construction', label: 'Budownictwo' },
	{ value: 'technology', label: 'Technologia' },
	{ value: 'healthcare', label: 'Opieka zdrowotna' },
	{ value: 'transport', label: 'Transport' },
	{ value: 'education', label: 'Edukacja' },
	{ value: 'gastronomy', label: 'Gastronomia' },
	{ value: 'services', label: 'Usługi' },
	{ value: 'trade', label: 'Handel' },
	{ value: 'logistics', label: 'Logistyka' },
	{ value: 'machines', label: 'Maszyny / sprzęt ciężki' }
];

function AddRequestModal({
	district,
	onClose,
	onSubmit,
	submitting
}: {
	district: District;
	onClose: () => void;
	onSubmit: (data: {
		district_id: string;
		title: string;
		description: string;
		needed_categories: string[];
		priority: 'low' | 'medium' | 'high' | 'critical';
	}) => void;
	submitting: boolean;
}) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [priority, setPriority] = useState<'medium' | 'high' | 'critical'>(
		'high'
	);
	const [categories, setCategories] = useState<string[]>([]);

	function toggleCategory(cat: string) {
		setCategories((prev) =>
			prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
		);
	}

	function handleSubmit() {
		if (!title.trim() || !description.trim()) return;
		onSubmit({
			district_id: district.id,
			title: title.trim(),
			description: description.trim(),
			needed_categories: categories,
			priority
		});
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
				<div className="p-6 border-b border-gray-100">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-bold text-gray-900">
							Nowe zgłoszenie — {district.name}
						</h2>
						<button
							onClick={onClose}
							className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 cursor-pointer">
							<X size={20} />
						</button>
					</div>
				</div>

				<div className="p-6 space-y-5">
					<div>
						<label className="text-sm font-medium text-gray-700 block mb-1.5">
							Tytuł zgłoszenia
						</label>
						<input
							className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-primary-blue focus:bg-white transition-colors"
							placeholder="np. Potrzebni ratownicy medyczni"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>

					<div>
						<label className="text-sm font-medium text-gray-700 block mb-1.5">
							Szczegóły
						</label>
						<textarea
							className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-blue focus:bg-white transition-colors resize-none min-h-[80px]"
							placeholder="Opisz czego potrzebujesz..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
						/>
					</div>

					<div>
						<label className="text-sm font-medium text-gray-700 block mb-2">
							Priorytet
						</label>
						<div className="flex gap-2">
							{(
								[
									[
										'medium',
										'Średni',
										'border-yellow-400 bg-yellow-50 text-yellow-700'
									],
									[
										'high',
										'Wysoki',
										'border-orange-400 bg-orange-50 text-orange-700'
									],
									[
										'critical',
										'Krytyczny',
										'border-red-400 bg-red-50 text-red-700'
									]
								] as const
							).map(([val, label, activeClass]) => (
								<button
									key={val}
									onClick={() => setPriority(val)}
									className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 transition-colors cursor-pointer ${
										priority === val
											? activeClass
											: 'border-gray-200 text-gray-500 hover:border-gray-300'
									}`}>
									{label}
								</button>
							))}
						</div>
					</div>

					<div>
						<label className="text-sm font-medium text-gray-700 block mb-2">
							Potrzebne specjalności / maszyny
						</label>
						<div className="flex flex-wrap gap-2">
							{CATEGORY_OPTIONS.map((c) => (
								<button
									key={c.value}
									onClick={() => toggleCategory(c.value)}
									className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
										categories.includes(c.value)
											? 'border-primary-blue bg-primary-blue/10 text-primary-blue'
											: 'border-gray-200 text-gray-600 hover:border-gray-300'
									}`}>
									{c.label}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="p-6 border-t border-gray-100 flex justify-end gap-3">
					<button
						onClick={onClose}
						disabled={submitting}
						className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
						Anuluj
					</button>
					<button
						onClick={handleSubmit}
						disabled={submitting || !title.trim() || !description.trim()}
						className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-blue text-white text-sm font-semibold hover:bg-primary-blue/90 transition-colors cursor-pointer disabled:opacity-50">
						{submitting ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<Plus size={16} />
						)}
						Dodaj zgłoszenie
					</button>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  District detail sidebar (responders + add request)                */
/* ------------------------------------------------------------------ */

function DistrictSidebar({
	district,
	crisis,
	responders,
	onClose,
	onAddRequest,
	categoryFilter,
	onCategoryFilter
}: {
	district: District;
	crisis: CrisisData;
	responders: CrisisResponder[];
	onClose: () => void;
	onAddRequest: () => void;
	categoryFilter: string | null;
	onCategoryFilter: (cat: string | null) => void;
}) {
	const districtResponders = responders.filter(
		(r) => r.district === district.id || r.district === district.name
	);
	const positiveResponders = districtResponders.filter(
		(r) => r.responded_positively
	);
	const filtered = categoryFilter
		? positiveResponders.filter((r) => r.category === categoryFilter)
		: positiveResponders;

	const categoryCounts = positiveResponders.reduce(
		(acc, r) => {
			acc[r.category] = (acc[r.category] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	const isAffected = crisis.affected_districts.includes(district.id);

	return (
		<div className="absolute top-0 right-0 bottom-0 w-96 bg-white shadow-xl z-20 flex flex-col border-l border-base-border animate-in slide-in-from-right duration-300">
			<div
				className="p-5 border-b border-base-border"
				style={{
					background: isAffected
						? `linear-gradient(135deg, #ef444415, #ef444405)`
						: `linear-gradient(135deg, ${district.color}15, ${district.color}05)`
				}}>
				<div className="flex items-center justify-between mb-3">
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer">
						<ChevronLeft size={18} />
					</button>
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer">
						<X size={18} />
					</button>
				</div>

				<div className="flex items-center gap-3">
					<div
						className="h-10 w-10 rounded-xl flex items-center justify-center"
						style={{
							backgroundColor: isAffected ? '#ef444420' : district.color + '20'
						}}>
						<MapPin
							size={20}
							style={{ color: isAffected ? '#ef4444' : district.color }}
						/>
					</div>
					<div>
						<h2 className="text-lg font-bold text-gray-900">{district.name}</h2>
						<p className="text-sm text-gray-500">
							{isAffected ? (
								<span className="text-red-600 font-medium">
									Strefa dotknięta kryzysem
								</span>
							) : (
								'Strefa bezpieczna'
							)}
						</p>
					</div>
				</div>
			</div>

			{/* Action button */}
			<div className="px-5 py-3 border-b border-base-border">
				<button
					onClick={onAddRequest}
					className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary-blue text-white text-sm font-medium hover:bg-primary-blue/90 transition-colors cursor-pointer">
					<Plus size={16} />
					Dodaj zgłoszenie / potrzebę
				</button>
			</div>

			{/* Category pills */}
			{Object.keys(categoryCounts).length > 0 && (
				<div className="px-5 py-3 border-b border-base-border">
					<p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
						Pozytywne odpowiedzi wg kategorii
					</p>
					<div className="flex flex-wrap gap-1.5">
						<button
							onClick={() => onCategoryFilter(null)}
							className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
								!categoryFilter
									? 'bg-primary-blue text-white'
									: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
							}`}>
							Wszystkie ({positiveResponders.length})
						</button>
						{Object.entries(categoryCounts).map(([cat, count]) => {
							const label =
								CATEGORY_OPTIONS.find((c) => c.value === cat)?.label || cat;
							return (
								<button
									key={cat}
									onClick={() =>
										onCategoryFilter(categoryFilter === cat ? null : cat)
									}
									className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
										categoryFilter === cat
											? 'bg-primary-blue text-white'
											: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
									}`}>
									{label} ({count})
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Responder list */}
			<div className="flex-1 overflow-y-auto p-3">
				{filtered.length > 0 ? (
					<div className="space-y-1">
						{filtered.map((r) => (
							<div
								key={r.id}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
								<div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
									<UserRound className="w-5 h-5 text-emerald-600" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-900 truncate">
										{r.name}
									</p>
									<p className="text-xs text-gray-500">{r.role}</p>
								</div>
								<span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
									Gotowy
								</span>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-full text-gray-400">
						<Users size={32} className="mb-2 opacity-50" />
						<p className="text-sm">Brak odpowiedzi z tej dzielnicy</p>
					</div>
				)}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Map polygons with crisis highlighting                             */
/* ------------------------------------------------------------------ */

function CrisisPolygons({
	affectedDistricts,
	onDistrictClick,
	selectedDistrictId
}: {
	affectedDistricts: string[];
	onDistrictClick: (district: District) => void;
	selectedDistrictId: string | null;
}) {
	const map = useMap();
	const geometryLib = useMapsLibrary('geometry');
	const polygonsRef = useRef<google.maps.Polygon[]>([]);

	useEffect(() => {
		if (!map || !geometryLib) return;

		polygonsRef.current.forEach((p) => p.setMap(null));
		polygonsRef.current = [];

		LUBLIN_DISTRICTS.forEach((district) => {
			const isSelected = district.id === selectedDistrictId;
			const isAffected = affectedDistricts.includes(district.id);

			const strokeColor = isAffected ? '#ef4444' : district.color;
			const fillColor = isAffected ? '#ef4444' : district.color;

			const polygon = new google.maps.Polygon({
				paths: district.polygon,
				strokeColor,
				strokeOpacity: isSelected ? 1 : 0.7,
				strokeWeight: isSelected ? 3 : isAffected ? 2.5 : 2,
				fillColor,
				fillOpacity: isSelected ? 0.4 : isAffected ? 0.25 : 0.1,
				map,
				zIndex: isSelected ? 10 : isAffected ? 5 : 1
			});

			polygon.addListener('click', () => onDistrictClick(district));
			polygon.addListener('mouseover', () => {
				if (district.id !== selectedDistrictId) {
					polygon.setOptions({
						fillOpacity: isAffected ? 0.35 : 0.25,
						strokeWeight: 3
					});
				}
			});
			polygon.addListener('mouseout', () => {
				if (district.id !== selectedDistrictId) {
					polygon.setOptions({
						fillOpacity: isAffected ? 0.25 : 0.1,
						strokeWeight: isAffected ? 2.5 : 2
					});
				}
			});

			polygonsRef.current.push(polygon);
		});

		return () => {
			polygonsRef.current.forEach((p) => p.setMap(null));
			polygonsRef.current = [];
		};
	}, [
		map,
		geometryLib,
		affectedDistricts,
		onDistrictClick,
		selectedDistrictId
	]);

	return null;
}

function CrisisMarkers({
	affectedDistricts,
	selectedDistrictId,
	onDistrictClick
}: {
	affectedDistricts: string[];
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
			const isAffected = affectedDistricts.includes(district.id);

			const bg = isSelected
				? isAffected
					? '#ef4444'
					: district.color
				: 'white';
			const textColor = isSelected ? 'white' : '#1f2937';
			const borderColor = isAffected ? '#ef4444' : district.color;

			const container = document.createElement('div');
			container.style.cssText = `
				display: flex; align-items: center; gap: 6px;
				padding: 6px 12px; border-radius: 20px;
				background: ${bg}; color: ${textColor};
				font-size: 13px; font-weight: 600; font-family: Inter, sans-serif;
				box-shadow: 0 2px 8px rgba(0,0,0,0.15);
				border: 2px solid ${borderColor};
				cursor: pointer; transition: transform 0.2s;
				white-space: nowrap; position: absolute;
				transform: translate(-50%, -50%);
			`;

			const badgeBg = isSelected
				? 'rgba(255,255,255,0.25)'
				: isAffected
					? '#ef444420'
					: district.color + '20';
			const badgeColor = isSelected
				? 'white'
				: isAffected
					? '#ef4444'
					: district.color;

			container.innerHTML = `
				${isAffected ? '<span style="font-size: 14px;">⚠️</span>' : ''}
				<span style="font-size: 11px; background: ${badgeBg}; color: ${badgeColor}; padding: 2px 6px; border-radius: 10px; font-weight: 700;">${district.employees.length}</span>
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
	}, [map, affectedDistricts, selectedDistrictId, onDistrictClick]);

	return null;
}

function UserDistrictSidebar({
	district,
	crisis,
	responders,
	onClose,
	isSignedUp,
	onSignup
}: {
	district: District;
	crisis: CrisisData;
	responders: CrisisResponder[];
	onClose: () => void;
	isSignedUp: boolean;
	onSignup: () => void;
}) {
	const districtResponders = responders.filter(
		(r) => r.district === district.id || r.district === district.name
	);
	const positiveResponders = districtResponders.filter(
		(r) => r.responded_positively
	);
	const isAffected = crisis.affected_districts.includes(district.id);

	return (
		<div className="absolute top-0 right-0 bottom-0 w-96 bg-white shadow-xl z-20 flex flex-col border-l border-base-border animate-in slide-in-from-right duration-300">
			<div
				className="p-5 border-b border-base-border"
				style={{
					background: isAffected
						? 'linear-gradient(135deg, #ef444415, #ef444405)'
						: `linear-gradient(135deg, ${district.color}15, ${district.color}05)`
				}}>
				<div className="flex items-center justify-between mb-3">
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer">
						<ChevronLeft size={18} />
					</button>
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer">
						<X size={18} />
					</button>
				</div>

				<div className="flex items-center gap-3">
					<div
						className="h-10 w-10 rounded-xl flex items-center justify-center"
						style={{
							backgroundColor: isAffected ? '#ef444420' : district.color + '20'
						}}>
						<MapPin
							size={20}
							style={{ color: isAffected ? '#ef4444' : district.color }}
						/>
					</div>
					<div>
						<h2 className="text-lg font-bold text-gray-900">{district.name}</h2>
						<p className="text-sm text-gray-500">
							{isAffected
								? 'Dzielnica objeta kryzysem'
								: 'Dzielnica poza strefa'}
						</p>
					</div>
				</div>
			</div>

			<div className="p-5 border-b border-base-border space-y-3">
				<p className="text-sm text-gray-600">
					Zglos swoja gotowosc do pomocy w tej dzielnicy.
				</p>
				<button
					onClick={onSignup}
					disabled={isSignedUp}
					className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
						isSignedUp
							? 'bg-emerald-100 text-emerald-700 cursor-default'
							: 'bg-red-600 text-white hover:bg-red-700'
					}`}>
					{isSignedUp ? <ShieldAlert size={16} /> : <Plus size={16} />}
					{isSignedUp ? 'Jestes oznaczony jako dostepny' : 'Zglos dostepnosc'}
				</button>
			</div>

			<div className="p-5 border-b border-base-border">
				<p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
					Statystyki dzielnicy
				</p>
				<div className="space-y-2 text-sm">
					<div className="flex items-center justify-between">
						<span className="text-gray-500">Pozytywne odpowiedzi</span>
						<span className="font-semibold text-emerald-600">
							{positiveResponders.length + (isSignedUp ? 1 : 0)}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-gray-500">Lacznie odpowiedzi</span>
						<span className="font-semibold text-gray-900">
							{districtResponders.length + (isSignedUp ? 1 : 0)}
						</span>
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-3">
				<div className="space-y-1">
					{positiveResponders.map((r) => (
						<div
							key={r.id}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
							<div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
								<UserRound className="w-5 h-5 text-emerald-600" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-900 truncate">
									{r.name}
								</p>
								<p className="text-xs text-gray-500">{r.role}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function UserCrisisRenderer({ crisis }: { crisis: CrisisData }) {
	const { callWithToken } = useAuthenticatedApi();
	const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
		null
	);
	const [responders, setResponders] = useState<CrisisResponder[]>([]);
	const [signedUpDistricts, setSignedUpDistricts] = useState<string[]>([]);

	useEffect(() => {
		async function fetchResponders() {
			try {
				const data = await callWithToken(getCrisisResponders, crisis.id);
				setResponders(data);
			} catch {
				const mockResponders: CrisisResponder[] = LUBLIN_DISTRICTS.flatMap(
					(d) =>
						d.employees
							.filter((e) => e.available)
							.map((e, i) => ({
								id: Math.random() * 10000 + i,
								user_id: i,
								name: e.name,
								role: e.role,
								category: e.category,
								district: d.id,
								available: e.available,
								responded_positively: Math.random() > 0.3
							}))
				);
				setResponders(mockResponders);
			}
		}

		fetchResponders();
	}, [callWithToken, crisis.id]);

	const handleDistrictClick = useCallback((district: District) => {
		setSelectedDistrict(district);
	}, []);

	const handleClose = useCallback(() => {
		setSelectedDistrict(null);
	}, []);

	function handleSignup(districtId: string) {
		if (signedUpDistricts.includes(districtId)) return;
		setSignedUpDistricts((prev) => [...prev, districtId]);
		toast.success('Zgloszenie gotowosci zapisane (mock)');
	}

	const totalPositive = responders.filter((r) => r.responded_positively).length;

	return (
		<>
			<CrisisPolygons
				affectedDistricts={crisis.affected_districts}
				onDistrictClick={handleDistrictClick}
				selectedDistrictId={selectedDistrict?.id ?? null}
			/>
			<CrisisMarkers
				affectedDistricts={crisis.affected_districts}
				onDistrictClick={handleDistrictClick}
				selectedDistrictId={selectedDistrict?.id ?? null}
			/>

			<div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg z-10 w-80">
				<div className="p-4 border-b border-gray-100">
					<div className="flex items-center gap-2 mb-2">
						<span
							className={`h-2.5 w-2.5 rounded-full animate-pulse ${
								crisis.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
							}`}
						/>
						<span
							className={`text-xs font-bold uppercase tracking-wide ${
								crisis.severity === 'critical'
									? 'text-red-600'
									: 'text-orange-600'
							}`}>
							{crisis.severity === 'critical' ? 'Krytyczny' : 'Wysoki'}
						</span>
					</div>
					<h3 className="text-sm font-bold text-gray-900">{crisis.title}</h3>
					<p className="text-xs text-gray-500 mt-1 line-clamp-2">
						{crisis.description}
					</p>
				</div>

				<div className="p-4 space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-gray-500">Dotkniete dzielnice</span>
						<span className="font-semibold text-gray-900">
							{crisis.affected_districts.length}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-500">Pozytywne odpowiedzi</span>
						<span className="font-semibold text-emerald-600">
							{totalPositive + signedUpDistricts.length}
						</span>
					</div>
				</div>
			</div>

			{selectedDistrict && (
				<UserDistrictSidebar
					district={selectedDistrict}
					crisis={crisis}
					responders={responders}
					onClose={handleClose}
					isSignedUp={signedUpDistricts.includes(selectedDistrict.id)}
					onSignup={() => handleSignup(selectedDistrict.id)}
				/>
			)}
		</>
	);
}

function GuestReadonlyCrisisRenderer({ crisis }: { crisis: CrisisData }) {
	return (
		<>
			<CrisisPolygons
				affectedDistricts={crisis.affected_districts}
				onDistrictClick={() => {}}
				selectedDistrictId={null}
			/>
			<CrisisMarkers
				affectedDistricts={crisis.affected_districts}
				onDistrictClick={() => {}}
				selectedDistrictId={null}
			/>

			<div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg z-10 w-80">
				<div className="p-4 border-b border-gray-100">
					<div className="flex items-center gap-2 mb-2">
						<span className="h-2.5 w-2.5 rounded-full animate-pulse bg-red-500" />
						<span className="text-xs font-bold uppercase tracking-wide text-red-600">
							Podglad publiczny
						</span>
					</div>
					<h3 className="text-sm font-bold text-gray-900">{crisis.title}</h3>
					<p className="text-xs text-gray-500 mt-1">{crisis.description}</p>
				</div>

				<div className="p-4 space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-gray-500">Widoczne dzielnice</span>
						<span className="font-semibold text-gray-900">
							{crisis.affected_districts.length}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-500">Tryb</span>
						<span className="font-semibold text-gray-900">Tylko odczyt</span>
					</div>
				</div>
			</div>
		</>
	);
}

/* ------------------------------------------------------------------ */
/*  Active crisis map view                                            */
/* ------------------------------------------------------------------ */

function CrisisMapContent({
	crisis,
	onEndCrisis,
	endingCrisis
}: {
	crisis: CrisisData;
	onEndCrisis: () => void;
	endingCrisis: boolean;
}) {
	const { callWithToken } = useAuthenticatedApi();
	const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
		null
	);
	const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
	const [responders, setResponders] = useState<CrisisResponder[]>([]);
	const [showAddRequest, setShowAddRequest] = useState(false);
	const [submittingRequest, setSubmittingRequest] = useState(false);
	const [notifying, setNotifying] = useState(false);

	useEffect(() => {
		async function fetchResponders() {
			try {
				const data = await callWithToken(getCrisisResponders, crisis.id);
				setResponders(data);
			} catch {
				// If endpoint not ready yet, use mock data from districts
				const mockResponders: CrisisResponder[] = LUBLIN_DISTRICTS.flatMap(
					(d) =>
						d.employees
							.filter((e) => e.available)
							.map((e, i) => ({
								id: Math.random() * 10000 + i,
								user_id: i,
								name: e.name,
								role: e.role,
								category: e.category,
								district: d.id,
								available: e.available,
								responded_positively: Math.random() > 0.3
							}))
				);
				setResponders(mockResponders);
			}
		}
		fetchResponders();
	}, [callWithToken, crisis.id]);

	const handleDistrictClick = useCallback((district: District) => {
		setSelectedDistrict(district);
		setCategoryFilter(null);
	}, []);

	const handleClose = useCallback(() => {
		setSelectedDistrict(null);
		setCategoryFilter(null);
	}, []);

	async function handleAddRequest(data: {
		district_id: string;
		title: string;
		description: string;
		needed_categories: string[];
		priority: 'low' | 'medium' | 'high' | 'critical';
	}) {
		setSubmittingRequest(true);
		try {
			await callWithToken(postCrisisRequest, crisis.id, data);
			toast.success('Zgłoszenie dodane');
			setShowAddRequest(false);
		} catch {
			toast.success('Zgłoszenie dodane (mock)');
			setShowAddRequest(false);
		} finally {
			setSubmittingRequest(false);
		}
	}

	async function handleNotify() {
		setNotifying(true);
		try {
			await callWithToken(postCrisisNotify, crisis.id);
			toast.success('Powiadomienia wysłane do wszystkich wolontariuszy');
		} catch {
			toast.success('Powiadomienia wysłane do wszystkich wolontariuszy (mock)');
		} finally {
			setNotifying(false);
		}
	}

	const totalPositive = responders.filter((r) => r.responded_positively).length;

	return (
		<>
			<CrisisPolygons
				affectedDistricts={crisis.affected_districts}
				onDistrictClick={handleDistrictClick}
				selectedDistrictId={selectedDistrict?.id ?? null}
			/>
			<CrisisMarkers
				affectedDistricts={crisis.affected_districts}
				onDistrictClick={handleDistrictClick}
				selectedDistrictId={selectedDistrict?.id ?? null}
			/>

			{/* Crisis info overlay */}
			<div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg z-10 w-80">
				<div className="p-4 border-b border-gray-100">
					<div className="flex items-center gap-2 mb-2">
						<span
							className={`h-2.5 w-2.5 rounded-full animate-pulse ${
								crisis.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
							}`}
						/>
						<span
							className={`text-xs font-bold uppercase tracking-wide ${
								crisis.severity === 'critical'
									? 'text-red-600'
									: 'text-orange-600'
							}`}>
							{crisis.severity === 'critical' ? 'Krytyczny' : 'Wysoki'}
						</span>
					</div>
					<h3 className="text-sm font-bold text-gray-900">{crisis.title}</h3>
					<p className="text-xs text-gray-500 mt-1 line-clamp-2">
						{crisis.description}
					</p>
				</div>

				<div className="p-4 space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-gray-500">Dotknięte dzielnice</span>
						<span className="font-semibold text-gray-900">
							{crisis.affected_districts.length}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-500">Pozytywne odpowiedzi</span>
						<span className="font-semibold text-emerald-600">
							{totalPositive}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-500">Łącznie powiadomionych</span>
						<span className="font-semibold text-gray-900">
							{responders.length}
						</span>
					</div>
				</div>

				<div className="p-3 border-t border-gray-100 space-y-2">
					<button
						onClick={handleNotify}
						disabled={notifying}
						className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary-blue text-white text-xs font-semibold hover:bg-primary-blue/90 transition-colors cursor-pointer disabled:opacity-50">
						{notifying ? (
							<Loader2 size={14} className="animate-spin" />
						) : (
							<Bell size={14} />
						)}
						Wyślij powiadomienie do wszystkich
					</button>
					<button
						onClick={onEndCrisis}
						disabled={endingCrisis}
						className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-gray-200 text-gray-600 text-xs font-semibold hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50">
						{endingCrisis ? (
							<Loader2 size={14} className="animate-spin" />
						) : (
							<ShieldOff size={14} />
						)}
						Zakończ kryzys
					</button>
				</div>
			</div>

			{/* District sidebar */}
			{selectedDistrict && (
				<DistrictSidebar
					district={selectedDistrict}
					crisis={crisis}
					responders={responders}
					onClose={handleClose}
					onAddRequest={() => setShowAddRequest(true)}
					categoryFilter={categoryFilter}
					onCategoryFilter={setCategoryFilter}
				/>
			)}

			{/* Add request modal */}
			{showAddRequest && selectedDistrict && (
				<AddRequestModal
					district={selectedDistrict}
					onClose={() => setShowAddRequest(false)}
					onSubmit={handleAddRequest}
					submitting={submittingRequest}
				/>
			)}
		</>
	);
}

/* ------------------------------------------------------------------ */
/*  Main export                                                       */
/* ------------------------------------------------------------------ */

export default function Crisis() {
	const { auth } = useAuth();
	const { callWithToken } = useAuthenticatedApi();
	const [crisis, setCrisis] = useState<CrisisData | null>(null);
	const [viewerProfile, setViewerProfile] =
		useState<CrisisViewerProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [showStartModal, setShowStartModal] = useState(false);
	const [submittingStart, setSubmittingStart] = useState(false);
	const [endingCrisis, setEndingCrisis] = useState(false);
	const isLoggedIn = Boolean(auth.user);

	useEffect(() => {
		async function fetchCrisis() {
			if (auth.isLoading) return;

			if (!isLoggedIn) {
				setCrisis(buildReadonlyGuestCrisis());
				setViewerProfile(null);
				setLoading(false);
				return;
			}

			try {
				const [data, profile] = await Promise.all([
					callWithToken(getActiveCrisis),
					callWithToken(getMyProfile)
				]);
				setCrisis(data);
				setViewerProfile(profile as CrisisViewerProfile);
			} catch {
				// No active crisis or endpoint not ready
				setCrisis(null);
				setViewerProfile(null);
			} finally {
				setLoading(false);
			}
		}
		fetchCrisis();
	}, [auth.isLoading, callWithToken, isLoggedIn]);

	async function handleStartCrisis(data: {
		title: string;
		description: string;
		severity: 'high' | 'critical';
		affected_districts: string[];
	}) {
		setSubmittingStart(true);
		try {
			const newCrisis = await callWithToken(postStartCrisis, data);
			setCrisis(newCrisis);
			emitCrisisStatus(true);
			setShowStartModal(false);
			toast.success('Kryzys ogłoszony — powiadomienia wysłane');
		} catch {
			// Mock: create local crisis object
			const mockCrisis: CrisisData = {
				id: Date.now(),
				title: data.title,
				description: data.description,
				severity: data.severity,
				started_at: new Date().toISOString(),
				affected_districts: data.affected_districts,
				status: 'active',
				created_by: 'current_user'
			};
			setCrisis(mockCrisis);
			emitCrisisStatus(true);
			setShowStartModal(false);
			toast.success('Kryzys ogłoszony — powiadomienia wysłane (mock)');
		} finally {
			setSubmittingStart(false);
		}
	}

	async function handleEndCrisis() {
		if (!crisis) return;
		setEndingCrisis(true);
		try {
			await callWithToken(postEndCrisis, crisis.id);
			setCrisis(null);
			emitCrisisStatus(false);
			toast.success('Kryzys zakończony');
		} catch {
			setCrisis(null);
			emitCrisisStatus(false);
			toast.success('Kryzys zakończony (mock)');
		} finally {
			setEndingCrisis(false);
		}
	}

	const isPublicOrganization =
		viewerProfile?.account_type === 'employer' &&
		(viewerProfile?.is_government_service === true ||
			viewerProfile?.institution_type === 'government');

	if (loading) {
		return (
			<BaseContentWrapper className="px-8">
				<div className="flex items-center justify-center py-32">
					<Loader2 size={32} className="animate-spin text-primary-blue" />
				</div>
			</BaseContentWrapper>
		);
	}

	if (!crisis) {
		if (!isPublicOrganization) {
			return (
				<BaseContentWrapper className="px-8 py-10">
					<div className="max-w-2xl mx-auto flex flex-col items-center text-center space-y-6">
						<div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
							<ShieldAlert size={36} className="text-emerald-500" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900">
							Brak aktywnego kryzysu
						</h1>
						<p className="text-gray-500 max-w-md">
							Aktualnie nie ma aktywnej sytuacji kryzysowej. Gdy kryzys zostanie
							ogloszony, tutaj zobaczysz dotkniete dzielnice i bedziesz mogl
							zglosic swoja dostepnosc.
						</p>
					</div>
				</BaseContentWrapper>
			);
		}

		return (
			<>
				<NoCrisisView onStart={() => setShowStartModal(true)} />
				{showStartModal && (
					<StartCrisisModal
						onClose={() => setShowStartModal(false)}
						onSubmit={handleStartCrisis}
						submitting={submittingStart}
					/>
				)}
			</>
		);
	}

	if (!GOOGLE_MAPS_API_KEY) {
		return (
			<BaseContentWrapper className="px-8">
				<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
					<MapPin size={48} className="text-gray-400 mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						Brak klucza Google Maps API
					</h2>
					<p className="text-sm text-gray-500 max-w-md">
						Ustaw zmienną VITE_GOOGLE_MAPS_API_KEY w pliku .env
					</p>
				</div>
			</BaseContentWrapper>
		);
	}

	return (
		<APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
			<div className="h-[calc(100vh-64px)] mt-[64px] w-full relative">
				<Map
					defaultCenter={LUBLIN_CENTER}
					defaultZoom={12}
					gestureHandling="greedy"
					disableDefaultUI={false}
					zoomControl
					streetViewControl={false}
					mapTypeControl={false}
					fullscreenControl={false}
					styles={[
						{ featureType: 'poi', stylers: [{ visibility: 'off' }] },
						{ featureType: 'transit', stylers: [{ visibility: 'off' }] }
					]}>
					{!isLoggedIn ? (
						<GuestReadonlyCrisisRenderer crisis={crisis} />
					) : isPublicOrganization ? (
						<CrisisMapContent
							crisis={crisis}
							onEndCrisis={handleEndCrisis}
							endingCrisis={endingCrisis}
						/>
					) : (
						<UserCrisisRenderer crisis={crisis} />
					)}
				</Map>
			</div>
		</APIProvider>
	);
}
