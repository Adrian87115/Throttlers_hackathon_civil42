import AppLogo from '@/components/icons/AppLogo/AppLogo';
import { AppRoutePaths } from '@/types/types';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function NotFound() {
	const { t } = useTranslation();

	return (
		<div className="min-h-screen bg-bg-darker text-white relative">
			<div className="absolute top-1/3 left-1/2 translate-x-[-50%] translate-y-[-50%] w-[700px]">
				<div className="flex flex-col items-center">
					<AppLogo />

					<h1 className="text-6xl mt-10 mb-4 font-medium">
						{t('notFound.title')}
					</h1>
					<span>{t('notFound.desc')}</span>

					<div className="h-2 bg-dimmed-blue w-full rounded-full my-10" />

					<Link to={AppRoutePaths.mainDashboard()}>
						<span className="border-b pb-1 text-primary-blue">
							{t('shared.goBack')}
						</span>
					</Link>
				</div>
			</div>
		</div>
	);
}
