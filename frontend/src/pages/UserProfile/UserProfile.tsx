import BaseDimmedBackground from '@/components/BaseDimmedBackground/BaseDimmedBackground';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { getMyProfile } from '@/services/auth';
import {
	BadgeCheck,
	Briefcase,
	Building2,
	Clock,
	Loader2,
	Mail,
	MapPin,
	Phone,
	ShieldCheck,
	Tag,
	User
} from 'lucide-react';
import { useEffect, useState } from 'react';

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

function VerificationBadge({ status }: { status?: string }) {
	if (!status) return null;

	const config: Record<string, { label: string; colors: string; icon: React.ReactNode }> = {
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

export default function UserProfile() {
	const { callWithToken } = useAuthenticatedApi();
	const [profile, setProfile] = useState<UserProfileData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

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
	const locationLabel = profile.district
		? `${profile.city}, ${profile.district}`
		: profile.city;
	const mainPhone = profile.phone || profile.org_phone;

	const personalInfo = [
		{ icon: <Mail size={18} />, label: 'Email', value: profile.email },
		mainPhone ? { icon: <Phone size={18} />, label: 'Telefon', value: mainPhone } : null,
		locationLabel
			? { icon: <MapPin size={18} />, label: 'Lokalizacja', value: locationLabel }
			: null,
		profile.role
			? { icon: <Briefcase size={18} />, label: 'Stanowisko', value: profile.role }
			: null,
		profile.experience_years !== undefined
			? {
					icon: <Clock size={18} />,
					label: 'Doświadczenie',
					value: `${profile.experience_years} lat`
				}
			: null,
		profile.category
			? { icon: <Tag size={18} />, label: 'Kategoria', value: profile.category }
			: null
	].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

	const orgInfo = [
		profile.organization_name
			? {
					icon: <Building2 size={18} />,
					label: 'Organizacja',
					value: profile.organization_name
				}
			: null,
		profile.contact_person
			? {
					icon: <User size={18} />,
					label: 'Osoba kontaktowa',
					value: profile.contact_person
				}
			: null,
		profile.org_address
			? {
					icon: <MapPin size={18} />,
					label: 'Adres organizacji',
					value: profile.org_address
				}
			: null,
		profile.nip ? { icon: <ShieldCheck size={18} />, label: 'NIP', value: profile.nip } : null,
		profile.regon
			? { icon: <ShieldCheck size={18} />, label: 'REGON', value: profile.regon }
			: null,
		profile.institution_type
			? {
					icon: <Building2 size={18} />,
					label: 'Typ instytucji',
					value: profile.institution_type
				}
			: null
	].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

	return (
		<BaseContentWrapper className="px-8 py-10">
			<div className="max-w-3xl mx-auto space-y-8">
				{/* Header card */}
				<BaseDimmedBackground className="p-8!">
					<div className="flex items-center gap-6">
						<div className="h-24 w-24 rounded-full bg-dimmed-blue/30 flex items-center justify-center shrink-0 shadow-sm">
							<User size={40} className="text-primary-blue" />
						</div>
						<div className="space-y-2">
							<h1 className="text-3xl font-bold text-gray-900">
								{displayName}
							</h1>
							<p className="text-gray-500">{profile.email}</p>
							<div className="flex flex-wrap items-center gap-2 pt-1">
								{profile.available !== undefined && (
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
				</BaseDimmedBackground>

				{/* Personal info */}
				{personalInfo.length > 0 && (
					<section>
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Dane osobowe
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{personalInfo.map((item) => (
								<InfoCard
									key={item.label}
									icon={item.icon}
									label={item.label}
									value={item.value}
								/>
							))}
						</div>
					</section>
				)}

				{/* Organization info */}
				{orgInfo.length > 0 && (
					<section>
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Dane organizacji
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{orgInfo.map((item) => (
								<InfoCard
									key={item.label}
									icon={item.icon}
									label={item.label}
									value={item.value}
								/>
							))}
						</div>
					</section>
				)}

				{/* Skills */}
				{profile.skills && (
					<BaseDimmedBackground>
						<h2 className="text-lg font-semibold text-gray-900 mb-3">
							Kwalifikacje i umiejętności
						</h2>
						<p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
							{profile.skills}
						</p>
					</BaseDimmedBackground>
				)}
			</div>
		</BaseContentWrapper>
	);
}

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
		<div className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
			<div className="h-9 w-9 rounded-lg bg-primary-blue/10 flex items-center justify-center shrink-0 text-primary-blue">
				{icon}
			</div>
			<div className="min-w-0">
				<p className="text-xs text-gray-500 uppercase tracking-wide">
					{label}
				</p>
				<p className="text-sm font-medium text-gray-900 mt-0.5 truncate">
					{value}
				</p>
			</div>
		</div>
	);
}
