import BaseDimmedBackground from '@/components/BaseDimmedBackground/BaseDimmedBackground';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { getMyProfile, patchMyProfile } from '@/services/auth';
import {
	BadgeCheck,
	Briefcase,
	Building2,
	Check,
	Clock,
	Loader2,
	Mail,
	MapPin,
	Pencil,
	Phone,
	ShieldCheck,
	Tag,
	User,
	X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UserProfileData {
	id: string | number;
	email: string;
	username: string;
	first_name?: string;
	last_name?: string;
	phone?: string;
	city?: string;
	district?: string;
	account_type: string;
	skills?: string;
	experience_years?: number;
	category?: string;
	role?: string;
	available?: boolean;
	organization_name?: string;
	nip?: string;
	regon?: string;
	org_address?: string;
	org_phone?: string;
	contact_person?: string;
	institution_type?: string;
	is_government_service?: boolean;
	is_verified?: boolean;
	verification_status?: string;
}

type EditableFields = Omit<
	UserProfileData,
	| 'id'
	| 'email'
	| 'account_type'
	| 'is_verified'
	| 'verification_status'
	| 'is_government_service'
>;

function VerificationBadge({ status }: { status?: string }) {
	if (!status) return null;

	const config: Record<
		string,
		{ label: string; colors: string; icon: React.ReactNode }
	> = {
		verified: {
			label: 'Zweryfikowane',
			colors: 'bg-emerald-50 text-emerald-700 border-emerald-200',
			icon: <BadgeCheck size={14} />
		},
		pending: {
			label: 'Oczekuje na weryfikację',
			colors: 'bg-amber-50 text-amber-700 border-amber-200',
			icon: <Clock size={14} />
		},
		rejected: {
			label: 'Odrzucone',
			colors: 'bg-red-50 text-red-600 border-red-200',
			icon: <ShieldCheck size={14} />
		}
	};

	const c = config[status] || {
		label: status,
		colors: 'bg-gray-50 text-gray-600 border-gray-200',
		icon: <ShieldCheck size={14} />
	};

	return (
		<span
			className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${c.colors}`}>
			{c.icon}
			{c.label}
		</span>
	);
}

const inputClass =
	'w-full h-9 rounded-md border border-dimmed-blue bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-blue-300 focus-visible:ring-dimmed-blue focus-visible:ring-[3px]';

export default function UserProfile() {
	const { callWithToken } = useAuthenticatedApi();
	const [profile, setProfile] = useState<UserProfileData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [draft, setDraft] = useState<Partial<EditableFields>>({});

	useEffect(() => {
		async function fetchProfile() {
			try {
				const res = (await callWithToken(getMyProfile)) as UserProfileData;
				setProfile(res);
			} catch {
				setError('Nie udało się pobrać danych profilu');
			} finally {
				setLoading(false);
			}
		}

		fetchProfile();
	}, [callWithToken]);

	function startEditing() {
		if (!profile) return;
		setDraft({
			username: profile.username,
			first_name: profile.first_name || '',
			last_name: profile.last_name || '',
			phone: profile.phone || '',
			city: profile.city || '',
			district: profile.district || '',
			skills: profile.skills || '',
			experience_years: profile.experience_years,
			category: profile.category || '',
			role: profile.role || '',
			available: profile.available,
			organization_name: profile.organization_name || '',
			nip: profile.nip || '',
			regon: profile.regon || '',
			org_address: profile.org_address || '',
			org_phone: profile.org_phone || '',
			contact_person: profile.contact_person || '',
			institution_type: profile.institution_type || ''
		});
		setEditing(true);
	}

	function cancelEditing() {
		setEditing(false);
		setDraft({});
	}

	function updateDraft<K extends keyof EditableFields>(
		key: K,
		value: EditableFields[K]
	) {
		setDraft((prev) => ({ ...prev, [key]: value }));
	}

	async function saveProfile() {
		if (!profile) return;
		setSaving(true);
		try {
			const payload: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(draft)) {
				const originalValue = profile[key as keyof UserProfileData];
				if (value !== originalValue && value !== '') {
					payload[key] = value;
				} else if (value === '' && originalValue) {
					payload[key] = null;
				}
			}

			if (Object.keys(payload).length === 0) {
				setEditing(false);
				return;
			}

			const updated = (await callWithToken(
				patchMyProfile,
				payload
			)) as UserProfileData;
			setProfile(updated);
			setEditing(false);
			toast.success('Profil zaktualizowany');
		} catch {
			toast.error('Nie udało się zapisać zmian');
		} finally {
			setSaving(false);
		}
	}

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
					<p className="text-red-500">{error || 'Brak danych profilu'}</p>
				</div>
			</BaseContentWrapper>
		);
	}

	const isEmployer = profile.account_type === 'employer';
	const displayName = isEmployer
		? profile.organization_name || profile.username
		: profile.first_name && profile.last_name
			? `${profile.first_name} ${profile.last_name}`
			: profile.username;
	const mainPhone = profile.phone || profile.org_phone;

	const personalFields: FieldDef[] = [
		{
			key: 'email',
			icon: <Mail size={18} />,
			label: 'Email',
			value: profile.email,
			readonly: true
		},
		{
			key: 'phone',
			icon: <Phone size={18} />,
			label: 'Telefon',
			value: mainPhone
		},
		{
			key: 'city',
			icon: <MapPin size={18} />,
			label: 'Miasto',
			value: profile.city,
			secondaryKey: 'district',
			secondaryLabel: 'Dzielnica',
			secondaryValue: profile.district
		},
		{
			key: 'role',
			icon: <Briefcase size={18} />,
			label: 'Stanowisko',
			value: profile.role
		},
		{
			key: 'experience_years',
			icon: <Clock size={18} />,
			label: 'Doświadczenie (lata)',
			value:
				profile.experience_years !== undefined
					? `${profile.experience_years}`
					: undefined,
			type: 'number'
		},
		{
			key: 'category',
			icon: <Tag size={18} />,
			label: 'Kategoria',
			value: profile.category
		}
	];

	const orgFields: FieldDef[] = [
		{
			key: 'organization_name',
			icon: <Building2 size={18} />,
			label: 'Organizacja',
			value: profile.organization_name
		},
		{
			key: 'contact_person',
			icon: <User size={18} />,
			label: 'Osoba kontaktowa',
			value: profile.contact_person
		},
		{
			key: 'org_address',
			icon: <MapPin size={18} />,
			label: 'Adres organizacji',
			value: profile.org_address
		},
		{
			key: 'nip',
			icon: <ShieldCheck size={18} />,
			label: 'NIP',
			value: profile.nip
		},
		{
			key: 'regon',
			icon: <ShieldCheck size={18} />,
			label: 'REGON',
			value: profile.regon
		},
		{
			key: 'institution_type',
			icon: <Building2 size={18} />,
			label: 'Typ instytucji',
			value: profile.institution_type
		}
	];

	const visiblePersonal = editing
		? personalFields
		: personalFields.filter((f) => f.value);
	const visibleOrg = editing
		? orgFields.filter((f) => isEmployer || f.value)
		: orgFields.filter((f) => f.value);

	return (
		<BaseContentWrapper className="px-8 py-10">
			<div className="max-w-3xl mx-auto space-y-8">
				{/* Header card */}
				<BaseDimmedBackground className="p-8!">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-6">
							<div className="h-24 w-24 rounded-full bg-dimmed-blue/30 flex items-center justify-center shrink-0 shadow-sm">
								<User size={40} className="text-primary-blue" />
							</div>
							<div className="space-y-2">
								{editing ? (
									<div className="flex gap-3">
										<input
											className={inputClass}
											placeholder="Imię"
											value={draft.first_name || ''}
											onChange={(e) =>
												updateDraft('first_name', e.target.value)
											}
										/>
										<input
											className={inputClass}
											placeholder="Nazwisko"
											value={draft.last_name || ''}
											onChange={(e) => updateDraft('last_name', e.target.value)}
										/>
									</div>
								) : (
									<h1 className="text-3xl font-bold text-gray-900">
										{displayName}
									</h1>
								)}
								<p className="text-gray-500">{profile.email}</p>
								<div className="flex flex-wrap items-center gap-2 pt-1">
									{editing ? (
										<button
											type="button"
											onClick={() => updateDraft('available', !draft.available)}
											className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
												draft.available
													? 'bg-emerald-50 text-emerald-700 border-emerald-200'
													: 'bg-red-50 text-red-600 border-red-200'
											}`}>
											<span
												className={`h-1.5 w-1.5 rounded-full ${draft.available ? 'bg-emerald-500' : 'bg-red-500'}`}
											/>
											{draft.available ? 'Dostępny' : 'Niedostępny'}
										</button>
									) : (
										profile.available !== undefined && (
											<span
												className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
													profile.available
														? 'bg-emerald-50 text-emerald-700 border-emerald-200'
														: 'bg-red-50 text-red-600 border-red-200'
												}`}>
												<span
													className={`h-1.5 w-1.5 rounded-full ${profile.available ? 'bg-emerald-500' : 'bg-red-500'}`}
												/>
												{profile.available ? 'Dostępny' : 'Niedostępny'}
											</span>
										)
									)}
									<VerificationBadge status={profile.verification_status} />
									{profile.is_verified && !profile.verification_status && (
										<span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
											<BadgeCheck size={14} />
											Zweryfikowane
										</span>
									)}
									{profile.is_government_service && (
										<span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
											<Building2 size={14} />
											Służba publiczna
										</span>
									)}
								</div>
							</div>
						</div>

						{/* Edit / Save / Cancel buttons */}
						<div className="flex items-center gap-2 shrink-0">
							{editing ? (
								<>
									<button
										onClick={cancelEditing}
										disabled={saving}
										className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
										<X size={20} />
									</button>
									<button
										onClick={saveProfile}
										disabled={saving}
										className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-blue text-white text-sm font-medium hover:bg-primary-blue/90 transition-colors shadow-sm cursor-pointer disabled:opacity-50">
										{saving ? (
											<Loader2 size={16} className="animate-spin" />
										) : (
											<Check size={16} />
										)}
										Zapisz
									</button>
								</>
							) : (
								<button
									onClick={startEditing}
									className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer">
									<Pencil size={16} />
									Edytuj
								</button>
							)}
						</div>
					</div>
				</BaseDimmedBackground>

				{/* Personal info */}
				{visiblePersonal.length > 0 && (
					<section>
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Dane osobowe
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{visiblePersonal.map((f) => (
								<EditableInfoCard
									key={f.key}
									field={f}
									editing={editing}
									draft={draft}
									onUpdate={updateDraft}
								/>
							))}
						</div>
					</section>
				)}

				{/* Organization info */}
				{visibleOrg.length > 0 && (
					<section>
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Dane organizacji
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{visibleOrg.map((f) => (
								<EditableInfoCard
									key={f.key}
									field={f}
									editing={editing}
									draft={draft}
									onUpdate={updateDraft}
								/>
							))}
						</div>
					</section>
				)}

				{/* Skills */}
				<BaseDimmedBackground>
					<h2 className="text-lg font-semibold text-gray-900 mb-3">
						Kwalifikacje i umiejętności
					</h2>
					{editing ? (
						<textarea
							className="w-full rounded-lg border border-dimmed-blue bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-[3px] focus:ring-dimmed-blue resize-none min-h-[120px]"
							placeholder="Opisz swoje kwalifikacje, certyfikaty, umiejętności..."
							value={draft.skills || ''}
							onChange={(e) => updateDraft('skills', e.target.value)}
							rows={5}
						/>
					) : profile.skills ? (
						<p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
							{profile.skills}
						</p>
					) : (
						<p className="text-sm text-gray-400 italic">
							Brak kwalifikacji — kliknij &quot;Edytuj&quot; aby dodać
						</p>
					)}
				</BaseDimmedBackground>
			</div>
		</BaseContentWrapper>
	);
}

interface FieldDef {
	key: string;
	icon: React.ReactNode;
	label: string;
	value?: string;
	readonly?: boolean;
	type?: 'text' | 'number';
	secondaryKey?: string;
	secondaryLabel?: string;
	secondaryValue?: string;
}

function EditableInfoCard({
	field,
	editing,
	draft,
	onUpdate
}: {
	field: FieldDef;
	editing: boolean;
	draft: Partial<EditableFields>;
	onUpdate: <K extends keyof EditableFields>(
		key: K,
		value: EditableFields[K]
	) => void;
}) {
	const draftValue = draft[field.key as keyof EditableFields];
	const currentValue =
		draftValue !== undefined && draftValue !== null
			? String(draftValue)
			: field.value || '';
	const currentSecondaryValue =
		field.secondaryKey &&
		(draft[field.secondaryKey as keyof EditableFields] !== undefined &&
		draft[field.secondaryKey as keyof EditableFields] !== null
			? String(draft[field.secondaryKey as keyof EditableFields])
			: field.secondaryValue || '');

	if (editing && !field.readonly) {
		return (
			<div className="flex items-start gap-4 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
				<div className="h-9 w-9 rounded-lg bg-primary-blue/10 flex items-center justify-center shrink-0 text-primary-blue mt-0.5">
					{field.icon}
				</div>
				<div className="flex-1 min-w-0 space-y-1">
					<p className="text-xs text-gray-500 uppercase tracking-wide">
						{field.label}
					</p>
					<input
						className={inputClass}
						type={field.type || 'text'}
						value={currentValue}
						onChange={(e) => {
							const val =
								field.type === 'number'
									? e.target.value === ''
										? undefined
										: Number(e.target.value)
									: e.target.value;
							onUpdate(field.key as keyof EditableFields, val as never);
						}}
						placeholder={field.label}
					/>
					{field.secondaryKey && (
						<>
							<p className="text-xs text-gray-500 uppercase tracking-wide pt-1">
								{field.secondaryLabel}
							</p>
							<input
								className={inputClass}
								value={currentSecondaryValue}
								onChange={(e) =>
									onUpdate(
										field.secondaryKey as keyof EditableFields,
										e.target.value as never
									)
								}
								placeholder={field.secondaryLabel}
							/>
						</>
					)}
				</div>
			</div>
		);
	}

	const displayValue = field.secondaryValue
		? `${field.value}, ${field.secondaryValue}`
		: field.value;

	return (
		<div className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
			<div className="h-9 w-9 rounded-lg bg-primary-blue/10 flex items-center justify-center shrink-0 text-primary-blue">
				{field.icon}
			</div>
			<div className="min-w-0">
				<p className="text-xs text-gray-500 uppercase tracking-wide">
					{field.label}
				</p>
				<p className="text-sm font-medium text-gray-900 mt-0.5 truncate">
					{displayValue}
				</p>
			</div>
		</div>
	);
}
