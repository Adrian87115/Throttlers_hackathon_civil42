import Logo from '../../../assets/images/logo.png';

type Props = {
	className?: string;
};

export default function AppLogo({ className }: Props) {
	return <img src={Logo} className={`h-12 w-min ${className || ''}`} />;
}
