import { useAuth } from '@/contexts/AuthUserContext';
import { AppRoutePaths } from '@/types/types';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BaseDropdown } from '../Dropdowns/BaseDropdown';
import UserProfilePicture from '../icons/UserProfilePicture/UserProfilePicture';

export default function Header() {
	const { getUser, resetAuth } = useAuth();
	const user = getUser();

	const { t } = useTranslation();

	function handleLogout() {
		resetAuth();
	}

	return (
		<>
			<header className="fixed top-0 z-100 w-full opacity-90 bg-bg-darker text-white text-lg">
				<div className="flex items-center h-[100px] px-10 py-5 gap-10 relative">
					<BaseDropdown
						trigger={
							<div className="flex items-center gap-5 mr-auto cursor-pointer logo-holder">
								<UserProfilePicture />
								<span>{user?.nickname}</span>
							</div>
						}
						contentClassName="w-46"
						items={[
							{
								label: t('header.yourAccount'),
								className: 'pointer-events-none'
							},
							{ separator: true },
							{
								label: (
									<Link to={AppRoutePaths.userProfile()} className="w-full">
										{t('header.profile')}
									</Link>
								),
								className: 'dropdown-item'
							},
							{
								label: (
									<Link to={AppRoutePaths.userSettings()} className="w-full">
										{t('header.settings')}
									</Link>
								),
								className: 'dropdown-item'
							},
							{ separator: true },
							{
								label: t('header.logout'),
								onClick: handleLogout,
								className: 'dropdown-item'
							}
						]}
					/>
				</div>
			</header>
		</>
	);
}
