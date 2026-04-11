import React from 'react';

type Props = {
	children: React.ReactNode;
	className?: string;
};

export default function BaseContentWrapper({ children, className }: Props) {
	return (
		<div
			className={`bg-bg-primary-white min-h-screen pt-header pb-20 text-white relative ${className ?? ''}`}>
			{children}
		</div>
	);
}
