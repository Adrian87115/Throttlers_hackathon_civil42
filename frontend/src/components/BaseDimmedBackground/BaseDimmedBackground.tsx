import React from 'react';

type Props = {
	children?: React.ReactNode;
	className?: string;
};

export default function BaseDimmedBackground({ children, className }: Props) {
	return (
		<div
			className={`p-5 bg-gray-400/10 rounded-lg shadow-base-dimmed-background shadow-gray-200/10 border border-gray-400/20 ${
				className || ''
			}`}>
			{children}
		</div>
	);
}
