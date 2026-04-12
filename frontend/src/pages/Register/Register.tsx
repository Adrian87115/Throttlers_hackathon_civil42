import BaseButton from '@/components/Buttons/BaseButton';
import AppLogo from '@/components/icons/AppLogo/AppLogo';
import BaseSpacer from '@/components/Spacers/BaseSpacer';
import { Input } from '@/components/ui/input';
import apiClient from '@/services/apiClient';
import { AppApiPaths, AppRoutePaths } from '@/types/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

type AccountType = 'user' | 'organization';
type OrgType = 'private' | 'government';

type BackendValidationError = {
	type?: string;
	loc?: unknown;
	msg?: string;
	input?: unknown;
	ctx?: unknown;
};

const FIELD_LABELS: Record<string, string> = {
	email: 'E-mail',
	password: 'Hasło',
	confirmPassword: 'Potwierdzenie hasła',
	first_name: 'Imię',
	last_name: 'Nazwisko',
	city: 'Miasto',
	district: 'Dzielnica',
	phone: 'Telefon',
	orgName: 'Nazwa organizacji',
	nip: 'NIP',
	regon: 'REGON',
	orgAddress: 'Adres siedziby',
	orgPhone: 'Telefon kontaktowy',
	contactPerson: 'Osoba kontaktowa',
	institutionType: 'Typ instytucji'
};

function formatBackendErrors(error: unknown): string[] {
	const fallback = 'Wystąpił błąd rejestracji';

	if (!error || typeof error !== 'object') {
		return [fallback];
	}

	const rawDetail = (error as { detail?: unknown }).detail;

	if (!rawDetail) {
		return [fallback];
	}

	if (typeof rawDetail === 'string') {
		const MESSAGES: Record<string, string> = {
			'Email is registered': 'Ten adres e-mail jest już zajęty.',
			'Organization name is taken': 'Nazwa organizacji jest już zajęta.',
			'orgName is required': 'Nazwa organizacji jest wymagana.',
			'Password must consist of: at least 8 characters, at least 1 small letter, at least 1 capital letter, at least 1 number, at least 1 special character':
				'Hasło musi zawierać: min. 8 znaków, małą i wielką literę, cyfrę oraz znak specjalny.',
			'Internal server error': 'Błąd serwera. Spróbuj ponownie później.'
		};

		return [MESSAGES[rawDetail] ?? rawDetail];
	}

	if (Array.isArray(rawDetail)) {
		const details = rawDetail as BackendValidationError[];
		const messages = details
			.map((detail) => {
				if (!detail || typeof detail !== 'object') {
					return null;
				}

				const loc = Array.isArray(detail.loc) ? detail.loc : [];
				const field = String(loc[loc.length - 1] ?? '').trim();
				const label = FIELD_LABELS[field] ?? field;
				const msg = typeof detail.msg === 'string' ? detail.msg : '';

				if (!msg) {
					return null;
				}

				return label ? `${label}: ${msg}` : msg;
			})
			.filter((message): message is string => Boolean(message));

		return messages.length ? messages : [fallback];
	}

	if (typeof rawDetail === 'object') {
		const detailMessage = (rawDetail as { msg?: unknown }).msg;
		if (typeof detailMessage === 'string' && detailMessage.trim()) {
			return [detailMessage];
		}
	}

	return [fallback];
}

export default function Register() {
	const { t } = useTranslation();

	const [accountType, setAccountType] = useState<AccountType>('user');
	const [orgType, setOrgType] = useState<OrgType>('private');

	const [formData, setFormData] = useState({
		email: '',
		password: '',
		confirmPassword: '',
		// user fields
		firstName: '',
		lastName: '',
		city: '',
		district: '',
		phone: '',
		// org fields
		orgName: '',
		nip: '',
		regon: '',
		orgAddress: '',
		orgPhone: '',
		contactPerson: '',
		// government-specific
		institutionType: ''
	});

	const [isPassVisible, setIsPassVisible] = useState(false);
	const [isConfirmPassVisible, setIsConfirmPassVisible] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	const navigate = useNavigate();

	function handleChange(
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	}

	async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setErrors([]);

		if (formData.password !== formData.confirmPassword) {
			setErrors(['Hasła nie są identyczne']);
			return;
		}

		setLoading(true);
		try {
			if (accountType === 'user') {
				await apiClient.post(AppApiPaths.postUserRegister(), {
					email: formData.email,
					password: formData.password,
					confirmPassword: formData.confirmPassword,
					first_name: formData.firstName,
					last_name: formData.lastName,
					city: formData.city,
					district: formData.district,
					phone: formData.phone
				});
			} else {
				await apiClient.post(AppApiPaths.postCompanyRegister(), {
					email: formData.email,
					password: formData.password,
					confirmPassword: formData.confirmPassword,
					orgName: formData.orgName,
					nip: formData.nip,
					regon: formData.regon,
					orgAddress: formData.orgAddress,
					orgPhone: formData.orgPhone,
					contactPerson: formData.contactPerson,
					institutionType:
						orgType === 'government' ? formData.institutionType : null
				});
			}
			navigate(AppRoutePaths.loginPage());
		} catch (err: unknown) {
			console.log('Registration error:', err);
			setErrors(formatBackendErrors(err));
		} finally {
			setLoading(false);
		}
	}

	async function handleGoogleLogin() {
		window.location.href = AppApiPaths.googleOAuthLogin();
	}

	const tabClass = (active: boolean) =>
		`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
			active
				? 'bg-primary-blue text-white shadow-sm'
				: 'text-gray-500 hover:text-gray-700'
		}`;

	return (
		<div className="bg-bg-primary-white min-h-screen flex justify-center items-center py-20">
			<div className="w-[600px] rounded-lg login-holder py-10 border border-dimmed-blue">
				<div className="flex flex-col">
					<div className="flex flex-col items-center text-primary-blue">
						<AppLogo />
						<h1 className="tracking-wide text-3xl font-medium mt-5">
							{t('register.title')}
						</h1>
						<span>{t('register.subtitle')}</span>
					</div>
					<BaseSpacer className="my-10 w-[70%]! mx-auto" />

					{/* Account type selector */}
					<div className="flex gap-2 w-[80%] mx-auto mb-8 bg-gray-100 p-1 rounded-lg">
						<button
							type="button"
							className={tabClass(accountType === 'user')}
							onClick={() => setAccountType('user')}>
							Osoba prywatna
						</button>
						<button
							type="button"
							className={tabClass(accountType === 'organization')}
							onClick={() => setAccountType('organization')}>
							Organizacja
						</button>
					</div>

					{/* Org type selector */}
					{accountType === 'organization' && (
						<div className="flex gap-2 w-[80%] mx-auto mb-8 bg-gray-100 p-1 rounded-lg">
							<button
								type="button"
								className={tabClass(orgType === 'private')}
								onClick={() => setOrgType('private')}>
								Prywatna
							</button>
							<button
								type="button"
								className={tabClass(orgType === 'government')}
								onClick={() => setOrgType('government')}>
								Państwowa
							</button>
						</div>
					)}

					<form onSubmit={handleRegister} className="contents">
						<div className="flex flex-col gap-8 w-[80%] mx-auto">
							{/* Common fields */}
							<div className="flex flex-col gap-1">
								<label>{t('login.email')}</label>
								<Input
									value={formData.email}
									onChange={handleChange}
									name="email"
									autoComplete="email"
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label>{t('login.password')}</label>
								<Input
									value={formData.password}
									type={isPassVisible ? 'text' : 'password'}
									onChange={handleChange}
									name="password"
									password={{
										passwordVisible: isPassVisible,
										setPasswordVisible: setIsPassVisible
									}}
									autoComplete="new-password"
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label>{t('register.confirmPassword')}</label>
								<Input
									value={formData.confirmPassword}
									type={isConfirmPassVisible ? 'text' : 'password'}
									onChange={handleChange}
									name="confirmPassword"
									password={{
										passwordVisible: isConfirmPassVisible,
										setPasswordVisible: setIsConfirmPassVisible
									}}
									autoComplete="new-password"
								/>
							</div>

							{accountType === 'user' && (
								<>
									<BaseSpacer className="my-2 w-full" />

									<div className="flex flex-col gap-1">
										<label>Imię</label>
										<Input
											value={formData.firstName}
											onChange={handleChange}
											name="firstName"
											autoComplete="given-name"
											placeholder="np. Jan"
										/>
									</div>

									<div className="flex flex-col gap-1">
										<label>Nazwisko</label>
										<Input
											value={formData.lastName}
											onChange={handleChange}
											name="lastName"
											autoComplete="family-name"
											placeholder="np. Kowalski"
										/>
									</div>

									<div className="flex flex-col gap-1">
										<label>Miasto</label>
										<Input
											value={formData.city}
											onChange={handleChange}
											name="city"
											placeholder="np. Lublin"
										/>
									</div>

									<div className="flex flex-col gap-1">
										<label>Dzielnica</label>
										<Input
											value={formData.district}
											onChange={handleChange}
											name="district"
											placeholder="np. Śródmieście"
										/>
									</div>

									<div className="flex flex-col gap-1">
										<label>Telefon komórkowy</label>
										<Input
											value={formData.phone}
											type="tel"
											onChange={handleChange}
											name="phone"
											autoComplete="tel"
											placeholder="+48 123 456 789"
										/>
									</div>
								</>
							)}

							{/* Organization fields */}
							{accountType === 'organization' && (
								<>
									<BaseSpacer className="my-2 w-full" />

									<div className="flex flex-col gap-1">
										<label>Nazwa organizacji</label>
										<Input
											value={formData.orgName}
											onChange={handleChange}
											name="orgName"
											placeholder="np. Fundacja Pomocna Dłoń"
										/>
									</div>

									<div className="flex flex-col gap-1">
										<label>NIP</label>
										<Input
											value={formData.nip}
											onChange={handleChange}
											name="nip"
											placeholder="0000000000"
										/>
									</div>

									<div className="flex flex-col gap-1">
										<label>REGON</label>
										<Input
											value={formData.regon}
											onChange={handleChange}
											name="regon"
											placeholder="000000000"
										/>
									</div>

									<div className="flex flex-col gap-1">
										<label>Adres siedziby</label>
										<Input
											value={formData.orgAddress}
											onChange={handleChange}
											name="orgAddress"
											placeholder="ul. Przykładowa 1, 00-000 Warszawa"
										/>
									</div>

									<div className="flex flex-col gap-1">
										<label>Telefon kontaktowy</label>
										<Input
											value={formData.orgPhone}
											onChange={handleChange}
											name="orgPhone"
											placeholder="+48 000 000 000"
										/>
									</div>

									<div className="flex flex-col gap-1">
										<label>Osoba kontaktowa</label>
										<Input
											value={formData.contactPerson}
											onChange={handleChange}
											name="contactPerson"
											placeholder="Imię i nazwisko"
										/>
									</div>

									{/* Government-specific fields */}
									{orgType === 'government' && (
										<div className="flex flex-col gap-1">
											<label>Typ instytucji</label>
											<select
												name="institutionType"
												value={formData.institutionType}
												onChange={handleChange}
												className="h-9 rounded-md border border-dimmed-blue bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-blue-300 focus-visible:ring-dimmed-blue focus-visible:ring-[3px]">
												<option value="">Wybierz typ instytucji</option>
												<option value="military">Siły zbrojne / MON</option>
												<option value="emergency">
													Służby ratunkowe (PSP, Pogotowie)
												</option>
												<option value="police">Policja</option>
												<option value="administration">
													Administracja rządowa / samorządowa
												</option>
												<option value="ngo">
													Organizacja pozarządowa (NGO)
												</option>
												<option value="other">Inna</option>
											</select>
										</div>
									)}
								</>
							)}
						</div>

						{errors.length > 0 && (
							<ul className="text-red-500 text-sm mt-4 w-[80%] mx-auto list-disc pl-5 space-y-1">
								{errors.map((message, index) => (
									<li key={`${message}-${index}`}>{message}</li>
								))}
							</ul>
						)}

						<div className="flex flex-col items-center gap-5 mt-15">
							<BaseButton type="submit" disabled={loading}>
								{loading ? 'Rejestracja...' : t('register.register')}
							</BaseButton>

							<div className="flex flex-col items-center gap-2">
								<Link
									to={AppRoutePaths.loginPage()}
									className="text-sm text-primary-blue hover:underline">
									{t('register.alreadyHaveAccount')}
								</Link>
								<Link
									to={AppRoutePaths.mainDashboard()}
									className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
									{t('shared.goBack')}
								</Link>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
