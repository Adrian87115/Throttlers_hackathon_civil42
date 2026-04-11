import * as React from 'react';

import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';

interface InputProps {
	password?: {
		passwordVisible: boolean;
		setPasswordVisible: React.Dispatch<React.SetStateAction<boolean>>;
	};
	containerClassName?: string;
	searchIcon?: boolean;
	searchIconSize?: number;
}

function Input({
	className,
	type,
	password,
	containerClassName,
	searchIcon,
	searchIconSize,
	...props
}: React.ComponentProps<'input'> & InputProps) {
	return (
		<div className={`relative flex ${containerClassName || ''} w-full`}>
			<input
				type={type}
				data-slot="input"
				className={cn(
					'file:text-foreground placeholder:text-muted-foreground selection:bg-dimmed-blue selection:text-white dark:bg-input/30 border-input flex h-9 rounded-md border bg-transparent py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
					'focus-visible:border-blue-300 focus-visible:ring-dimmed-blue focus-visible:ring-[3px]',
					'aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 text-white w-full px-3',
					`${searchIcon ? 'pl-8' : ''}`,
					className
				)}
				{...props}
			/>
			{searchIcon && (
				<Search
					className="absolute top-1/2 left-2 translate-y-[-50%]"
					size={searchIconSize || 20}
				/>
			)}

			{password?.setPasswordVisible && (
				<>
					<div
						className="absolute right-2 top-1/2 translate-y-[-50%] cursor-pointer"
						onClick={() => {
							password.setPasswordVisible(!password.passwordVisible);
						}}>
						{password.passwordVisible ? (
							<IoEyeOutline size={20} />
						) : (
							<IoEyeOffOutline size={20} />
						)}
					</div>
				</>
			)}
		</div>
	);
}

export { Input };
