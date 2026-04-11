import { useAuth } from '@/contexts/AuthUserContext';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from './BaseModal';

type Props = {};

export default function SessionExpiredModal({}: Props) {
	const { resetAuth, auth } = useAuth();
	const { t } = useTranslation();

	const [open, setIsOpen] = useState<boolean>(false);

	useEffect(() => {
		setIsOpen(auth.hasExpired);
	}, [auth.hasExpired]);

	return (
		<BaseModal
			onDialogClose={resetAuth}
			onDialogSubmit={resetAuth}
			className="z-1000"
			title={t('sessionExpiredModal.title')}
			description={t('sessionExpiredModal.description')}
			isOpen={open}
			setIsOpen={setIsOpen}
			buttonContinueClassName="mx-auto"
			buttonContinueCustomText={t('shared.ok')}
		/>
	);
}
