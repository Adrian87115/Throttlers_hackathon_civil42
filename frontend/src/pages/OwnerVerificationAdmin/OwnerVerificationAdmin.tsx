import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import {
	approveOwnerVerification,
	getOwnerPendingVerifications,
	rejectOwnerVerification,
	type PendingVerificationRequest
} from '@/services/auth';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type VerificationTargetFilter = 'all' | 'employer' | 'gov_service';

const targetLabel: Record<VerificationTargetFilter, string> = {
	all: 'Wszystkie',
	employer: 'Pracodawca',
	gov_service: 'Służba publiczna'
};

export default function OwnerVerificationAdmin() {
	const { callWithToken } = useAuthenticatedApi();
	const [requests, setRequests] = useState<PendingVerificationRequest[]>([]);
	const [targetFilter, setTargetFilter] = useState<VerificationTargetFilter>('all');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeRowId, setActiveRowId] = useState<number | null>(null);

	const loadRequests = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await callWithToken(getOwnerPendingVerifications, targetFilter);
			setRequests(data);
		} catch {
			setError('Nie udało się pobrać oczekujących zgłoszeń weryfikacji.');
		} finally {
			setIsLoading(false);
		}
	}, [callWithToken, targetFilter]);

	useEffect(() => {
		loadRequests();
	}, [loadRequests]);

	const counts = useMemo(() => {
		return {
			all: requests.length,
			employer: requests.filter((req) => req.target === 'employer').length,
			gov_service: requests.filter((req) => req.target === 'gov_service').length
		};
	}, [requests]);

	async function handleAction(
		request: PendingVerificationRequest,
		action: 'approve' | 'reject'
	) {
		setActiveRowId(request.user_id);
		setError(null);

		try {
			if (action === 'approve') {
				await callWithToken(
					approveOwnerVerification,
					request.user_id,
					request.target
				);
			} else {
				await callWithToken(
					rejectOwnerVerification,
					request.user_id,
					request.target
				);
			}

			setRequests((prev) => prev.filter((item) => item.user_id !== request.user_id));
		} catch {
			setError('Nie udało się zapisać decyzji. Spróbuj ponownie.');
		} finally {
			setActiveRowId(null);
		}
	}

	return (
		<BaseContentWrapper className="px-8 py-10">
			<div className="mx-auto max-w-6xl space-y-6">
				<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								Panel właściciela: weryfikacje
							</h1>
							<p className="mt-2 text-sm text-gray-600">
								Przeglądaj oczekujące zgłoszenia i akceptuj lub odrzucaj
								weryfikacje organizacji.
							</p>
						</div>

						<button
							type="button"
							onClick={loadRequests}
							className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer">
							<RefreshCw size={16} />
							Odśwież
						</button>
					</div>

					<div className="mt-5 flex flex-wrap gap-2">
						{(Object.keys(targetLabel) as VerificationTargetFilter[]).map((target) => {
							const isActive = targetFilter === target;
							return (
								<button
									key={target}
									type="button"
									onClick={() => setTargetFilter(target)}
									className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
										isActive
											? 'border-primary-blue bg-primary-blue/10 text-primary-blue'
											: 'border-gray-300 text-gray-700 hover:bg-gray-50'
									}`}>
									{targetLabel[target]}
									<span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 border border-gray-200">
										{counts[target]}
									</span>
								</button>
							);
						})}
					</div>
				</section>

				{error && (
					<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
						<AlertTriangle size={16} />
						{error}
					</div>
				)}

				<section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
					{isLoading ? (
						<div className="flex items-center justify-center gap-3 py-20 text-gray-600">
							<Loader2 size={22} className="animate-spin" />
							Ładowanie zgłoszeń...
						</div>
					) : requests.length === 0 ? (
						<div className="py-20 text-center text-gray-600">
							Brak oczekujących zgłoszeń dla wybranego filtra.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[760px]">
								<thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
									<tr>
										<th className="px-5 py-3">Użytkownik</th>
										<th className="px-5 py-3">Email</th>
										<th className="px-5 py-3">Typ weryfikacji</th>
										<th className="px-5 py-3">Status</th>
										<th className="px-5 py-3 text-right">Akcje</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{requests.map((request) => {
										const isRowBusy = activeRowId === request.user_id;
										return (
											<tr key={request.user_id} className="hover:bg-gray-50/70">
												<td className="px-5 py-4 font-medium text-gray-900">
													{request.username}
												</td>
												<td className="px-5 py-4 text-gray-700">{request.email}</td>
												<td className="px-5 py-4 text-gray-700">
													{request.target === 'gov_service'
														? 'Służba publiczna'
														: 'Pracodawca'}
												</td>
												<td className="px-5 py-4">
													<span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
														{request.verification_status}
													</span>
												</td>
												<td className="px-5 py-4">
													<div className="flex items-center justify-end gap-2">
														<button
															type="button"
															onClick={() => handleAction(request, 'approve')}
															disabled={isRowBusy}
															className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer">
															{isRowBusy ? (
																<Loader2 size={14} className="animate-spin" />
															) : (
																<CheckCircle2 size={14} />
															)}
															Akceptuj
														</button>
														<button
															type="button"
															onClick={() => handleAction(request, 'reject')}
															disabled={isRowBusy}
															className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer">
															{isRowBusy ? (
																<Loader2 size={14} className="animate-spin" />
															) : (
																<XCircle size={14} />
															)}
															Odrzuć
														</button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</section>
			</div>
		</BaseContentWrapper>
	);
}
