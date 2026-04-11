import BaseButton from '@/components/Buttons/BaseButton';
import AppLogo from '@/components/icons/AppLogo/AppLogo';
import BaseSpacer from '@/components/Spacers/BaseSpacer';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthUserContext';
import { handleUserLogin } from '@/services/login';
import { AccessToken, RefreshToken } from '@/types/ids';
import { AppRoutePaths } from '@/types/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGoogle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
	const { t } = useTranslation();
	const [formData, setFormData] = useState<{ email: string; password: string }>(
		{ email: '', password: '' }
	);

	const [isPassVisible, setIsPassVisible] = useState<boolean>(false);
	const navigate = useNavigate();
	const { setAuthTokens } = useAuth();

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	}

	async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		console.log(formData);

		const res = await handleUserLogin(formData);

		setAuthTokens(
			res.accessToken as AccessToken,
			res.refreshToken as RefreshToken
		);

		navigate(AppRoutePaths.mainDashboard());
	}

	async function handleGoogleLogin() {
		alert(
			'Funkcja logowania przez Google jest obecnie niedostępna. Prosimy o skorzystanie z tradycyjnego logowania.'
		);
	}

	return (
		<div className="bg-bg-primary-white min-h-screen flex justify-center items-center py-20">
			<div className="w-[600px] rounded-lg login-holder py-10 border border-dimmed-blue">
				<div className="flex flex-col">
					<div className="flex flex-col items-center text-primary-blue">
						<AppLogo />
						<h1 className="tracking-wide text-3xl font-medium mt-5">
							{t('login.welcome')}
						</h1>
						<span>{t('login.loginToApp')}</span>
					</div>
					<BaseSpacer className="my-10 w-[70%]! mx-auto" />

					<form onSubmit={handleLogin} className="contents">
						<div className="flex flex-col gap-8 w-[80%] mx-auto">
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
									autoComplete="current-password"
								/>
							</div>
						</div>

						<div className="flex flex-col items-center gap-5 mt-15">
							<BaseButton
								endIcon={<FaGoogle size={20} />}
								className="w-fit"
								onClick={handleGoogleLogin}>
								{t('login.googleLogin')}
							</BaseButton>

							<BaseButton type="submit">{t('login.login')}</BaseButton>

							<Link
								to={AppRoutePaths.registerPage()}
								className="text-sm text-primary-blue hover:underline">
								{t('register.noAccount')}
							</Link>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
