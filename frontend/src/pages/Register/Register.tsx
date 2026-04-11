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

export default function Register() {
	const { t } = useTranslation();

	const [accountType, setAccountType] = useState<AccountType>('user');
	const [orgType, setOrgType] = useState<OrgType>('private');

	const [formData, setFormData] = useState({
		email: '',
		password: '',
		confirmPassword: '',
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
	const [error, setError] = useState('');
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
		setError('');

		if (formData.password !== formData.confirmPassword) {
			setError('Hasła nie są identyczne');
			return;
		}

		setLoading(true);
		try {
			if (accountType === 'user') {
				await apiClient.post(AppApiPaths.postUserRegister(), {
					email: formData.email,
					password: formData.password,
					confirmPassword: formData.confirmPassword
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
			const detail =
				(err as { detail?: string })?.detail ?? 'Wystąpił błąd rejestracji';
			setError(detail);
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

						{error && (
							<p className="text-red-500 text-sm text-center mt-4 w-[80%] mx-auto">
								{error}
							</p>
						)}

						<div className="flex flex-col items-center gap-5 mt-15">
							<BaseButton type="submit" disabled={loading}>
								{loading ? 'Rejestracja...' : t('register.register')}
							</BaseButton>

							<Link
								to={AppRoutePaths.loginPage()}
								className="text-sm text-primary-blue hover:underline">
								{t('register.alreadyHaveAccount')}
							</Link>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
