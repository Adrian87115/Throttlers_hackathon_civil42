import BaseButton from '@/components/Buttons/BaseButton';
import AppLogo from '@/components/icons/AppLogo/AppLogo';
import { Input } from '@/components/ui/input';
import { AppApiPaths, AppRoutePaths } from '@/types/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSpotify } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Login() {
	const { t } = useTranslation();
	const [formData, setFormData] = useState<{ email: string; password: string }>(
		{ email: '', password: '' }
	);

	const [isPassVisible, setIsPassVisible] = useState<boolean>(false);

	const navigate = useNavigate();

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	}

	function handleLogin(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		console.log(formData);

		navigate(AppRoutePaths.mainDashboard());
	}

	async function handleSpotifyLogin() {
		window.location.href = AppApiPaths.spotifyOAuthLogin();
	}

	return (
		<div className="bg-bg-primary-dark min-h-screen flex justify-center items-center py-20">
			<div className="w-[600px] rounded-lg login-holder py-10 border border-gray-500 text-white">
				<div className="flex flex-col">
					<div className="flex flex-col items-center">
						<AppLogo />
						<h1 className="tracking-wide text-3xl font-medium mt-5">
							{t('login.welcome')}
						</h1>
						<span>{t('login.loginToApp')}</span>
					</div>
					<div className="bg-gray-500 w-[90%] mx-auto h-[2px] my-10" />

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
								endIcon={<FaSpotify size={20} />}
								className="w-fit"
								onClick={handleSpotifyLogin}>
								{t('login.spotifyLogin')}
							</BaseButton>

							<BaseButton type="submit">{t('login.login')}</BaseButton>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
