import LoadingImageSkeleton from '@/components/LoadingSkeletons/LoadingImageSkeleton';
import { useAuth } from '@/contexts/AuthUserContext';
import { UserRound } from 'lucide-react';

type Props = {
	className?: string;
};

export default function UserProfilePicture({ className }: Props) {
	const { getUser } = useAuth();
	const user = getUser();

	// todo: change

	return false ? (
		<LoadingImageSkeleton
			url={(user as any).spotifyProfilePicture || ''}
			className={`h-16 w-16 rounded-full shadow-base shadow-white profile-pict ${
				className || ''
			}`}
		/>
	) : (
		<div
			className={`h-16 w-16 rounded-full shadow-base bg-dimmed-blue/30 flex items-center justify-center profile-pict ${
				className || ''
			}`}>
			<UserRound className="w-[60%] h-[60%]" />
		</div>
	);
}
