import { primaryBlueTheme } from '@/utils/mui_extended';
import { Button, ThemeProvider } from '@mui/material';

type Props = {
	className?: string;
	onClick?: React.MouseEventHandler | React.FormEventHandler;
	icon: React.JSX.Element;
	disabled?: boolean;
	type?: 'button' | 'submit' | 'reset' | undefined;
	size?: 'small' | 'medium' | 'large';
};

export default function BaseIconButton({
	className,
	onClick,
	icon,
	disabled,
	type,
	size
}: Props) {
	return (
		<ThemeProvider theme={primaryBlueTheme}>
			<Button
				disabled={disabled}
				variant="contained"
				type={type}
				size={size || 'medium'}
				onClick={onClick}
				className={`font-semibold text-white bg-bg-lighter border-white 
				border min-w-10 min-h-10 rounded-md p-0 disabled:opacity-30 ${className}`}>
				{icon}
			</Button>
		</ThemeProvider>
	);
}
