import BaseButton from '@/components/Buttons/BaseButton';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthUserContext';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { getMyProfile } from '@/services/auth';
import { AppRoutePaths } from '@/types/types';
import {
	AlertTriangle,
	Car,
	CheckCircle2,
	Handshake,
	Heart,
	Shield,
	Truck,
	Wrench
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AVAILABILITY_OPTIONS = [
	{
		id: 'social',
		label: 'Akcje społeczne',
		desc: 'Zbiórki, wydarzenia charytatywne',
		icon: Heart
	},
	{
		id: 'crisis',
		label: 'Sytuacje kryzysowe',
		desc: 'Powodzie, pożary, klęski żywiołowe',
		icon: AlertTriangle
	},
	{
		id: 'logistics',
		label: 'Wsparcie logistyczne',
		desc: 'Transport, magazynowanie, organizacja',
		icon: Truck
	},
	{
		id: 'medical',
		label: 'Pomoc medyczna',
		desc: 'Pierwsza pomoc, opieka nad poszkodowanymi',
		icon: Shield
	}
] as const;

const EQUIPMENT_OPTIONS = [
	{ id: 'car', label: 'Samochód osobowy', icon: Car },
	{ id: 'truck', label: 'Pojazd dostawczy / bus', icon: Truck },
	{ id: 'tools', label: 'Narzędzia (łopaty, piły, agregat)', icon: Wrench },
	{ id: 'firstaid', label: 'Apteczka / defibrylator', icon: Shield }
] as const;

export default function VolunteerSignup() {
	const navigate = useNavigate();
	const { getUser } = useAuth();
	const { callWithToken } = useAuthenticatedApi();
	const user = getUser();
	const [submitted, setSubmitted] = useState(false);

	const [form, setForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		city: '',
		district: '',
		availability: [] as string[],
		equipment: [] as string[],
		skills: '',
		acceptTerms: false,
		acceptAlerts: false
	});

	useEffect(() => {
		let isCancelled = false;

		async function prefillFromLoggedUser() {
			if (!user) return;

			try {
				const profile = (await callWithToken(getMyProfile)) as {
					first_name?: string;
					last_name?: string;
					email?: string;
					phone?: string;
					org_phone?: string;
					city?: string;
					district?: string;
				};

				if (isCancelled) return;

				setForm((prev) => ({
					...prev,
					firstName: prev.firstName || profile.first_name || '',
					lastName: prev.lastName || profile.last_name || '',
					email: prev.email || profile.email || user.email || '',
					phone: prev.phone || profile.phone || profile.org_phone || '',
					city: prev.city || profile.city || '',
					district: prev.district || profile.district || ''
				}));
			} catch {
				if (isCancelled) return;
				setForm((prev) => ({
					...prev,
					email: prev.email || user.email || ''
				}));
			}
		}

		prefillFromLoggedUser();

		return () => {
			isCancelled = true;
		};
	}, [callWithToken, user]);

	function handleChange(
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) {
		setForm({ ...form, [e.target.name]: e.target.value });
	}

	function toggleOption(field: 'availability' | 'equipment', id: string) {
		setForm((prev) => {
			const arr = prev[field];
			return {
				...prev,
				[field]: arr.includes(id) ? arr.filter((v) => v !== id) : [...arr, id]
			};
		});
	}

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, []);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		console.log('Volunteer signup:', form);
		setSubmitted(true);
	}

	if (submitted) {
		return (
			<BaseContentWrapper className="px-8">
				<div className="max-w-xl mx-auto text-center py-20">
					<CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
					<h1 className="text-3xl font-bold text-gray-900 mb-3">
						Dziękujemy za rejestrację!
					</h1>
					<p className="text-gray-600 mb-8">
						Twoje zgłoszenie zostało przyjęte. Otrzymasz powiadomienie, gdy w
						Twoim regionie pojawi się akcja wymagająca wsparcia wolontariuszy.
					</p>
					<BaseButton onClick={() => navigate(AppRoutePaths.volunteers())}>
						Wróć do wolontariatu
					</BaseButton>
				</div>
			</BaseContentWrapper>
		);
	}

	return (
		<BaseContentWrapper className="px-8">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<section className="mb-10 text-center">
					<Handshake size={48} className="text-primary-blue mx-auto mb-4" />
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Dołącz do wolontariuszy
					</h1>
					<p className="text-gray-600">
						Wypełnij formularz, aby zarejestrować się jako wolontariusz Open
						Hands. Określ swoją dostępność, kwalifikacje i posiadane zasoby.
					</p>
				</section>

				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Personal info */}
					<fieldset className="rounded-xl border border-base-border bg-white p-6 shadow-sm space-y-5">
						<legend className="text-lg font-semibold text-gray-900 px-2">
							Dane osobowe
						</legend>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col gap-1">
								<label className="text-sm font-medium text-gray-700">
									Imię *
								</label>
								<Input
									name="firstName"
									value={form.firstName}
									onChange={handleChange}
									className="text-gray-900"
									required
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label className="text-sm font-medium text-gray-700">
									Nazwisko *
								</label>
								<Input
									name="lastName"
									value={form.lastName}
									onChange={handleChange}
									className="text-gray-900"
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col gap-1">
								<label className="text-sm font-medium text-gray-700">
									Email *
								</label>
								<Input
									name="email"
									type="email"
									value={form.email}
									onChange={handleChange}
									className="text-gray-900"
									required
									autoComplete="email"
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label className="text-sm font-medium text-gray-700">
									Telefon
								</label>
								<Input
									name="phone"
									type="tel"
									value={form.phone}
									onChange={handleChange}
									className="text-gray-900"
									autoComplete="tel"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="flex flex-col gap-1">
								<label className="text-sm font-medium text-gray-700">
									Miasto *
								</label>
								<Input
									name="city"
									value={form.city}
									onChange={handleChange}
									className="text-gray-900"
									required
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label className="text-sm font-medium text-gray-700">
									Dzielnica
								</label>
								<Input
									name="district"
									value={form.district}
									onChange={handleChange}
									className="text-gray-900"
									placeholder="np. Czuby Północne"
								/>
							</div>
						</div>
					</fieldset>

					{/* Availability */}
					<fieldset className="rounded-xl border border-base-border bg-white p-6 shadow-sm space-y-4">
						<legend className="text-lg font-semibold text-gray-900 px-2">
							Gotowość do pomocy
						</legend>
						<p className="text-sm text-gray-500">
							Zaznacz, w jakich sytuacjach jesteś gotów/gotowa pomagać.
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{AVAILABILITY_OPTIONS.map((opt) => {
								const selected = form.availability.includes(opt.id);
								const Icon = opt.icon;
								return (
									<button
										key={opt.id}
										type="button"
										onClick={() => toggleOption('availability', opt.id)}
										className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all cursor-pointer ${
											selected
												? 'border-primary-blue bg-primary-blue/5 ring-1 ring-primary-blue/30'
												: 'border-base-border bg-white hover:border-gray-300'
										}`}>
										<div
											className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
												selected
													? 'bg-primary-blue/10 text-primary-blue'
													: 'bg-gray-100 text-gray-400'
											}`}>
											<Icon size={20} />
										</div>
										<div>
											<p className="font-medium text-gray-900 text-sm">
												{opt.label}
											</p>
											<p className="text-xs text-gray-500">{opt.desc}</p>
										</div>
									</button>
								);
							})}
						</div>
					</fieldset>

					{/* Equipment */}
					<fieldset className="rounded-xl border border-base-border bg-white p-6 shadow-sm space-y-4">
						<legend className="text-lg font-semibold text-gray-900 px-2">
							Posiadane zasoby
						</legend>
						<p className="text-sm text-gray-500">
							Zaznacz, jakie zasoby możesz udostępnić w razie potrzeby.
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{EQUIPMENT_OPTIONS.map((opt) => {
								const selected = form.equipment.includes(opt.id);
								const Icon = opt.icon;
								return (
									<button
										key={opt.id}
										type="button"
										onClick={() => toggleOption('equipment', opt.id)}
										className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all cursor-pointer ${
											selected
												? 'border-primary-blue bg-primary-blue/5 ring-1 ring-primary-blue/30'
												: 'border-base-border bg-white hover:border-gray-300'
										}`}>
										<div
											className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
												selected
													? 'bg-primary-blue/10 text-primary-blue'
													: 'bg-gray-100 text-gray-400'
											}`}>
											<Icon size={20} />
										</div>
										<p className="font-medium text-gray-900 text-sm">
											{opt.label}
										</p>
									</button>
								);
							})}
						</div>
					</fieldset>

					{/* Skills */}
					<fieldset className="rounded-xl border border-base-border bg-white p-6 shadow-sm space-y-4">
						<legend className="text-lg font-semibold text-gray-900 px-2">
							Kwalifikacje i umiejętności
						</legend>
						<textarea
							name="skills"
							value={form.skills}
							onChange={handleChange}
							rows={4}
							placeholder="np. prawo jazdy kat. C, kurs pierwszej pomocy, obsługa wózka widłowego, znajomość języka ukraińskiego..."
							className="w-full rounded-lg border border-dimmed-blue bg-transparent px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-300 focus:ring-[3px] focus:ring-dimmed-blue resize-none"
						/>
					</fieldset>

					{/* Consents */}
					<fieldset className="rounded-xl border border-base-border bg-white p-6 shadow-sm space-y-4">
						<legend className="text-lg font-semibold text-gray-900 px-2">
							Zgody
						</legend>

						<label className="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								checked={form.acceptTerms}
								onChange={(e) =>
									setForm({ ...form, acceptTerms: e.target.checked })
								}
								className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary-blue"
								required
							/>
							<span className="text-sm text-gray-700">
								Akceptuję regulamin platformy Open Hands i wyrażam zgodę na
								przetwarzanie moich danych osobowych w celu koordynacji działań
								wolontariackich. *
							</span>
						</label>
					</fieldset>

					{/* Submit */}
					<div className="flex justify-center pb-10">
						<BaseButton type="submit" className="px-10! py-3!">
							Zarejestruj się jako wolontariusz
						</BaseButton>
					</div>
				</form>
			</div>
		</BaseContentWrapper>
	);
}
