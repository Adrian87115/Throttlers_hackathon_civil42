import React from 'react';

type Props = {
	children?: React.ReactNode;
	onClick?: () => void;
	className?: string;
	startIcon?: React.JSX.Element;
	endIcon?: React.JSX.Element;
	disabled?: boolean;
};

export default function TopHoverButton({
	children,
	onClick,
	className,
	startIcon,
	endIcon,
	disabled
}: Props) {
	return (
		<button
			className={`bottom-top-hover-button flex items-center gap-2 ${
				disabled ? 'pointer-events-none opacity-40' : ''
			} ${className}`}
			onClick={onClick}
			disabled={disabled}>
			{startIcon}
			{children}
			{endIcon}
		</button>
	);
}
