import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { getMyProfile } from '@/services/auth';
import {
	Briefcase,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Shield,
	User
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserProfileData {
	id: string;
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

	return (
		<BaseContentWrapper className="px-8">
			<div className="max-w-3xl mx-auto">
				{/* Header */}
				<section className="flex items-center gap-6 mb-10">
					<div className="h-20 w-20 rounded-full bg-dimmed-blue/30 flex items-center justify-center shrink-0">
						<User size={36} className="text-primary-blue" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							{profile.first_name && profile.last_name
								? `${profile.first_name} ${profile.last_name}`
								: profile.username}
						</h1>
						<p className="text-gray-500 mt-1">{profile.email}</p>
						{profile.available !== undefined && (
							<span
								className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${
									profile.available
										? 'bg-green-100 text-green-700'
										: 'bg-red-100 text-red-600'
								}`}>
								{profile.available ? 'Dostępny' : 'Niedostępny'}
							</span>
						)}
					</div>
				</section>

				{/* Info cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
					<InfoCard
						icon={<Mail size={20} />}
						label="Email"
						value={profile.email}
					/>
					{profile.phone && (
						<InfoCard
							icon={<Phone size={20} />}
							label="Telefon"
							value={profile.phone}
						/>
					)}
					{profile.city && (
						<InfoCard
							icon={<MapPin size={20} />}
							label="Lokalizacja"
							value={
								profile.district
									? `${profile.city}, ${profile.district}`
									: profile.city
							}
						/>
					)}
					{profile.role && (
						<InfoCard
							icon={<Briefcase size={20} />}
							label="Stanowisko"
							value={profile.role}
						/>
					)}
					{profile.experience_years !== undefined && (
						<InfoCard
							icon={<Shield size={20} />}
							label="Doświadczenie"
							value={`${profile.experience_years} lat`}
						/>
					)}
					{profile.category && (
						<InfoCard
							icon={<Briefcase size={20} />}
							label="Kategoria"
							value={profile.category}
						/>
					)}
				</div>

				{/* Skills */}
				{profile.skills && (
					<section className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
						<h2 className="text-lg font-semibold text-gray-900 mb-3">
							Kwalifikacje i umiejętności
						</h2>
						<p className="text-sm text-gray-600 whitespace-pre-line">
							{profile.skills}
						</p>
					</section>
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
		<div className="rounded-xl border border-base-border bg-white p-5 shadow-sm flex items-start gap-4">
			<div className="h-10 w-10 rounded-lg bg-primary-blue/10 flex items-center justify-center shrink-0 text-primary-blue">
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
