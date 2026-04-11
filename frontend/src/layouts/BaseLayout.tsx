import Header from '@/components/Header/Header';
import SessionExpiredModal from '@/components/Modals/SessionExpiredModal';
import React from 'react';

type Props = {
	children: React.ReactNode;
};

export default function BaseLayout({ children }: Props) {
	return (
		<div className="flex flex-col">
			<SessionExpiredModal />
			<Header />
			{children}
		</div>
	);
}
