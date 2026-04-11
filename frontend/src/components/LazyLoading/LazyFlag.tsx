import { LazyLoadContextImage } from './LazyLoadContextImage';

export default function LazyFlag({
	code,
	size = 20
}: {
	code: string;
	size?: number;
}) {
	const baseUrl: string = `https://react-circle-flags.pages.dev/${code}.svg`;
	return <LazyLoadContextImage src={baseUrl} width={size} height={size} />;
}
