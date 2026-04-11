import BaseButton from '@/components/Buttons/BaseButton';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { getMyProfile, postOpenHandsAlert } from '@/services/auth';
import type { CategoryKey } from '@/pages/MainDashboard/EmployeeCard';
import { LUBLIN_DISTRICTS } from '@/pages/EmployeeMap/districts';
import {
	AlertTriangle,
	Building2,
	CheckCircle2,
	ChevronDown,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Send,
	Shield,
	User,
	Users
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface OrgProfileData {
	id: string;
	email: string;
	username: string;
	account_type: string;
	organization_name: string;
	organization_description?: string;
	nip?: string;
	regon?: string;
	org_address?: string;
	org_phone?: string;
	contact_person?: string;
	institution_type?: string;
	is_government_service: boolean;
	is_verified: boolean;
	verification_status: string;
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
	construction: 'Budownictwo',
	agriculture: 'Rolnictwo',
	automotive: 'Motoryzacja',
	technology: 'Technologia',
	healthcare: 'Medycyna',
	education: 'Edukacja',
	gastronomy: 'Gastronomia',
	trade: 'Handel',
	transport: 'Transport',
	services: 'Usługi'
};

const INSTITUTION_LABELS: Record<string, string> = {
	military: 'Siły zbrojne / MON',
	emergency: 'Służby ratunkowe (PSP, Pogotowie)',
	police: 'Policja',
	administration: 'Administracja rządowa / samorządowa',
	ngo: 'Organizacja pozarządowa (NGO)',
	other: 'Inna'
};

export default function OrgProfile() {
	const { callWithToken } = useAuthenticatedApi();
	const [profile, setProfile] = useState<OrgProfileData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function fetchProfile() {
			try {
				const res = (await callWithToken(getMyProfile)) as OrgProfileData;
				setProfile(res);
			} catch {
				setError('Nie udało się pobrać danych profilu organizacji');
			} finally {
				setLoading(false);
			}
		}

		fetchProfile();
	}, [callWithToken]);

	if (loading) {
		return (
			<BaseContentWrapper className="px-8">
				<div className="flex items-center justify-center py-32">
					<Loader2 size={32} className="animate-spin text-primary-blue" />
				</div>
			</BaseContentWrapper>
		);
	}

	if (error || !profile) {
		return (
			<BaseContentWrapper className="px-8">
				<div className="text-center py-32">
					<p className="text-red-500">
						{error || 'Brak danych profilu organizacji'}
					</p>
				</div>
			</BaseContentWrapper>
		);
	}

	return (
		<BaseContentWrapper className="px-8">
			<div className="max-w-5xl mx-auto">
				{/* Header */}
				<section className="flex items-center gap-6 mb-10">
					<div className="h-20 w-20 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
						<Building2 size={36} className="text-violet-600" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							{profile.organization_name}
						</h1>
						<p className="text-gray-500 mt-1">{profile.email}</p>
						<div className="flex items-center gap-2 mt-2">
							<span
								className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
									profile.is_verified
										? 'bg-green-100 text-green-700'
										: 'bg-amber-100 text-amber-700'
								}`}>
								{profile.is_verified ? 'Zweryfikowana' : 'Oczekuje na weryfikację'}
							</span>
							{profile.is_government_service && (
								<span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
									Organizacja państwowa
								</span>
							)}
						</div>
					</div>
				</section>

				{/* Org info */}
				<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
					<InfoCard
						icon={<Mail size={20} />}
						label="Email"
						value={profile.email}
					/>
					{profile.org_phone && (
						<InfoCard
							icon={<Phone size={20} />}
							label="Telefon"
							value={profile.org_phone}
						/>
					)}
					{profile.org_address && (
						<InfoCard
							icon={<MapPin size={20} />}
							label="Adres siedziby"
							value={profile.org_address}
						/>
					)}
					{profile.contact_person && (
						<InfoCard
							icon={<User size={20} />}
							label="Osoba kontaktowa"
							value={profile.contact_person}
						/>
					)}
					{profile.nip && (
						<InfoCard
							icon={<Shield size={20} />}
							label="NIP"
							value={profile.nip}
						/>
					)}
					{profile.institution_type && (
						<InfoCard
							icon={<Building2 size={20} />}
							label="Typ instytucji"
							value={
								INSTITUTION_LABELS[profile.institution_type] ??
								profile.institution_type
							}
						/>
					)}
				</section>

				{/* Government-only sections */}
				{profile.is_government_service && (
					<>
						<CategoryStats />
						<VolunteersByDistrict />
						<OpenHandsAlertSection />
					</>
				)}
			</div>
		</BaseContentWrapper>
	);
}

/* ── Category stats ──────────────────────────────────────── */

function CategoryStats() {
	const stats = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const district of LUBLIN_DISTRICTS) {
			for (const emp of district.employees) {
				if (emp.available) {
					counts[emp.category] = (counts[emp.category] || 0) + 1;
				}
			}
		}
		return Object.entries(counts)
			.map(([key, count]) => ({
				category: key as CategoryKey,
				label: CATEGORY_LABELS[key as CategoryKey] ?? key,
				count
			}))
			.sort((a, b) => b.count - a.count);
	}, []);

	const total = stats.reduce((sum, s) => sum + s.count, 0);

	return (
		<section className="mb-10">
			<h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
				<Users size={22} />
				Statystyki dostępnych specjalistów
			</h2>
			<div className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
				<p className="text-sm text-gray-500 mb-4">
					Łącznie dostępnych:{' '}
					<span className="font-bold text-gray-900">{total}</span>
				</p>
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
					{stats.map((s) => (
						<div
							key={s.category}
							className="rounded-lg bg-gray-50 border border-base-border p-3 text-center">
							<p className="text-2xl font-bold text-primary-blue">
								{s.count}
							</p>
							<p className="text-xs text-gray-600 mt-1">{s.label}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ── Volunteers by district ──────────────────────────────── */

function VolunteersByDistrict() {
	const [expandedDistrict, setExpandedDistrict] = useState<string | null>(
		null
	);

	const districtsWithAvailable = useMemo(
		() =>
			LUBLIN_DISTRICTS.map((d) => ({
				...d,
				availableCount: d.employees.filter((e) => e.available).length
			})).sort((a, b) => b.availableCount - a.availableCount),
		[]
	);

	return (
		<section className="mb-10">
			<h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
				<MapPin size={22} />
				Wolontariusze wg dzielnic
			</h2>
			<div className="space-y-2">
				{districtsWithAvailable.map((district) => (
					<div
						key={district.id}
						className="rounded-xl border border-base-border bg-white shadow-sm overflow-hidden">
						<button
							onClick={() =>
								setExpandedDistrict(
									expandedDistrict === district.id ? null : district.id
								)
							}
							className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
							<div className="flex items-center gap-3">
								<div
									className="h-3 w-3 rounded-full shrink-0"
									style={{ backgroundColor: district.color }}
								/>
								<span className="font-medium text-gray-900">
									{district.name}
								</span>
							</div>
							<div className="flex items-center gap-3">
								<span className="text-sm text-gray-500">
									{district.availableCount} dostępnych
								</span>
								<ChevronDown
									size={16}
									className={`text-gray-400 transition-transform ${
										expandedDistrict === district.id ? 'rotate-180' : ''
									}`}
								/>
							</div>
						</button>

						{expandedDistrict === district.id && (
							<div className="border-t border-base-border px-4 pb-4">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
									{district.employees
										.filter((e) => e.available)
										.map((emp) => (
											<div
												key={emp.id}
												className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
												<div className="h-8 w-8 rounded-full bg-primary-blue/10 flex items-center justify-center shrink-0">
													<User
														size={14}
														className="text-primary-blue"
													/>
												</div>
												<div>
													<p className="text-sm font-medium text-gray-900">
														{emp.name}
													</p>
													<p className="text-xs text-gray-500">
														{emp.role}
													</p>
												</div>
											</div>
										))}
									{district.employees.filter((e) => e.available).length ===
										0 && (
										<p className="text-sm text-gray-400 col-span-2 py-2">
											Brak dostępnych wolontariuszy w tej dzielnicy
										</p>
									)}
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		</section>
	);
}

/* ── Open Hands Alert ────────────────────────────────────── */

function OpenHandsAlertSection() {
	const { callWithToken } = useAuthenticatedApi();
	const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
	const [alertMessage, setAlertMessage] = useState('');
	const [alertSeverity, setAlertSeverity] = useState<'high' | 'critical'>(
		'high'
	);
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);

	function toggleDistrict(id: string) {
		setSelectedDistricts((prev) =>
			prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
		);
	}

	function selectAll() {
		setSelectedDistricts(LUBLIN_DISTRICTS.map((d) => d.id));
	}

	function clearAll() {
		setSelectedDistricts([]);
	}

	async function handleSendAlert() {
		if (!alertMessage.trim() || selectedDistricts.length === 0) return;

		setSending(true);
		try {
			await callWithToken(postOpenHandsAlert, {
				districts: selectedDistricts,
				message: alertMessage,
				severity: alertSeverity
			});
			setSent(true);
			setAlertMessage('');
			setSelectedDistricts([]);
			setTimeout(() => setSent(false), 4000);
		} catch {
			// error handled silently for now
		} finally {
			setSending(false);
		}
	}

	return (
		<section className="mb-10">
			<h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
				<AlertTriangle size={22} className="text-red-500" />
				Wyślij alert Open Hands
			</h2>

			<div className="rounded-xl border border-red-200 bg-red-50/30 p-6 shadow-sm space-y-6">
				<p className="text-sm text-gray-600">
					Wyślij pilne powiadomienie do wolontariuszy w wybranych dzielnicach.
					Alert trafi do wszystkich osób, które wyraziły gotowość do pomocy w
					sytuacjach kryzysowych.
				</p>

				{/* Severity */}
				<div>
					<label className="text-sm font-medium text-gray-700 block mb-2">
						Poziom pilności
					</label>
					<div className="flex gap-3">
						<button
							type="button"
							onClick={() => setAlertSeverity('high')}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
								alertSeverity === 'high'
									? 'bg-amber-500 text-white'
									: 'bg-white border border-base-border text-gray-600 hover:bg-gray-50'
							}`}>
							Wysoki
						</button>
						<button
							type="button"
							onClick={() => setAlertSeverity('critical')}
							className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
								alertSeverity === 'critical'
									? 'bg-red-600 text-white'
									: 'bg-white border border-base-border text-gray-600 hover:bg-gray-50'
							}`}>
							Krytyczny
						</button>
					</div>
				</div>

				{/* Message */}
				<div>
					<label className="text-sm font-medium text-gray-700 block mb-2">
						Treść alertu
					</label>
					<textarea
						value={alertMessage}
						onChange={(e) => setAlertMessage(e.target.value)}
						rows={3}
						placeholder="Opisz sytuację i jakiego wsparcia potrzebujesz..."
						className="w-full rounded-lg border border-dimmed-blue bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-[3px] focus:ring-dimmed-blue resize-none"
					/>
				</div>

				{/* District selection */}
				<div>
					<div className="flex items-center justify-between mb-2">
						<label className="text-sm font-medium text-gray-700">
							Wybierz dzielnice ({selectedDistricts.length} z{' '}
							{LUBLIN_DISTRICTS.length})
						</label>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={selectAll}
								className="text-xs text-primary-blue hover:underline cursor-pointer">
								Zaznacz wszystkie
							</button>
							<span className="text-gray-300">|</span>
							<button
								type="button"
								onClick={clearAll}
								className="text-xs text-gray-500 hover:underline cursor-pointer">
								Odznacz
							</button>
						</div>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
						{LUBLIN_DISTRICTS.map((d) => {
							const selected = selectedDistricts.includes(d.id);
							return (
								<button
									key={d.id}
									type="button"
									onClick={() => toggleDistrict(d.id)}
									className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors cursor-pointer ${
										selected
											? 'border-red-300 bg-red-50 text-red-700'
											: 'border-base-border bg-white text-gray-600 hover:bg-gray-50'
									}`}>
									<div
										className="h-2.5 w-2.5 rounded-full shrink-0"
										style={{ backgroundColor: d.color }}
									/>
									{d.name}
								</button>
							);
						})}
					</div>
				</div>

				{/* Send */}
				<div className="flex items-center gap-4">
					<BaseButton
						onClick={handleSendAlert}
						disabled={
							sending ||
							!alertMessage.trim() ||
							selectedDistricts.length === 0
						}
						className="bg-red-600! hover:bg-red-700!">
						{sending ? (
							<>
								<Loader2 size={16} className="animate-spin mr-2" />
								Wysyłanie...
							</>
						) : (
							<>
								<Send size={16} className="mr-2" />
								Wyślij alert
							</>
						)}
					</BaseButton>

					{sent && (
						<span className="flex items-center gap-1.5 text-sm text-green-600">
							<CheckCircle2 size={16} />
							Alert wysłany pomyślnie
						</span>
					)}
				</div>
			</div>
		</section>
	);
}

/* ── Shared ──────────────────────────────────────────────── */

function InfoCard({
	icon,
	label,
	value
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="rounded-xl border border-base-border bg-white p-5 shadow-sm flex items-start gap-4">
			<div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 text-violet-600">
				{icon}
			</div>
			<div>
				<p className="text-xs text-gray-500 uppercase tracking-wide">
					{label}
				</p>
				<p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
			</div>
		</div>
	);
}
