import BaseButton from '@/components/Buttons/BaseButton';
import { Briefcase, MapPin, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type CategoryKey =
	| 'construction'
	| 'agriculture'
	| 'automotive'
	| 'technology'
	| 'healthcare'
	| 'education'
	| 'gastronomy'
	| 'trade'
	| 'transport'
	| 'services';

export type Employee = {
	id: string;
	name: string;
	role: string;
	category: CategoryKey;
	location: string;
	experience: number;
	avatarUrl?: string;
	available: boolean;
};

type Props = {
	employee: Employee;
};

export default function EmployeeCard({ employee }: Props) {
	const { t } = useTranslation();

	return (
		<div className="group rounded-xl border border-base-border bg-white p-5 shadow-base transition-all duration-200 hover:shadow-base-tile hover:-translate-y-0.5">
			<div className="flex items-start gap-4">
				{/* Avatar */}
				{employee.avatarUrl ? (
					<img
						src={employee.avatarUrl}
						alt={employee.name}
						className="h-14 w-14 rounded-full object-cover shrink-0"
					/>
				) : (
					<div className="h-14 w-14 rounded-full bg-dimmed-blue/30 flex items-center justify-center shrink-0">
						<UserRound className="w-7 h-7 text-primary-blue" />
					</div>
				)}

				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between gap-2">
						<h3 className="font-semibold text-gray-900 truncate">
							{employee.name}
						</h3>
						<span
							className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
								employee.available
									? 'bg-green-100 text-green-700'
									: 'bg-red-100 text-red-600'
							}`}>
							{employee.available
								? t('dashboard.available')
								: t('dashboard.unavailable')}
						</span>
					</div>

					<p className="text-sm text-grayed-out mt-0.5">{employee.role}</p>

					<div className="flex items-center gap-3 mt-1">
						<div className="flex items-center gap-1 text-xs text-base-muted-foreground">
							<MapPin size={12} />
							<span>{employee.location}</span>
						</div>
						<div className="flex items-center gap-1 text-xs text-base-muted-foreground">
							<Briefcase size={12} />
							<span>{t('dashboard.experienceYears', { count: employee.experience })}</span>
						</div>
					</div>

					<span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-dimmed-blue/20 text-primary-blue">
						{t(`dashboard.categories.${employee.category}` as const)}
					</span>
				</div>
			</div>

			<div className="mt-4 pt-3 border-t border-base-border">
				<BaseButton size="small" className="w-full!">
					{t('dashboard.viewProfile')}
				</BaseButton>
			</div>
		</div>
	);
}
