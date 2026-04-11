import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { AppRoutePaths } from '@/types/types';
import { Handshake, Heart, Shield, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Volunteers() {
	const { t } = useTranslation();

	return (
		<BaseContentWrapper className="px-8">
			<section className="mb-10">
				<h1 className="text-3xl font-bold text-gray-900">
					{t('volunteers.title', 'Wolontariat')}
				</h1>
				<p className="text-base-muted-foreground mt-1">
					{t(
						'volunteers.subtitle',
						'Dołącz do akcji pomocowych i wspieraj lokalne społeczności'
					)}
				</p>
			</section>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
				<div className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
					<div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
						<Heart size={24} className="text-rose-500" />
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Akcje społeczne
					</h3>
					<p className="text-sm text-gray-600">
						Pomagaj w organizacji zbiórek, wydarzeń charytatywnych i lokalnych
						inicjatyw na rzecz osób potrzebujących.
					</p>
				</div>

				<div className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
					<div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
						<Shield size={24} className="text-amber-500" />
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Sytuacje kryzysowe
					</h3>
					<p className="text-sm text-gray-600">
						Zgłoś gotowość do pomocy w sytuacjach awaryjnych. Służby państwowe
						mogą szybko skontaktować się z wolontariuszami w Twoim regionie.
					</p>
				</div>

				<div className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
					<div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
						<Users size={24} className="text-blue-500" />
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Wsparcie logistyczne
					</h3>
					<p className="text-sm text-gray-600">
						Udostępnij swoje zasoby — pojazdy, sprzęt lub umiejętności — gdy
						będą najbardziej potrzebne.
					</p>
				</div>
			</div>

			<section className="rounded-2xl border border-base-border bg-linear-to-br from-primary-blue/5 to-transparent p-8 text-center">
				<Handshake size={48} className="text-primary-blue mx-auto mb-4" />
				<h2 className="text-2xl font-bold text-gray-900 mb-3">
					Chcesz zostać wolontariuszem?
				</h2>
				<p className="text-gray-600 max-w-lg mx-auto mb-6">
					Uzupełnij swój profil, zaznacz gotowość do wolontariatu i określ swoje
					kwalifikacje. Otrzymasz powiadomienia o akcjach w Twoim regionie.
				</p>
				<Link
					to={AppRoutePaths.volunteerSignup()}
					className="inline-block px-6 py-3 rounded-lg bg-primary-blue text-white font-medium hover:bg-primary-blue/90 transition-colors shadow-sm cursor-pointer">
					Dołącz do wolontariuszy
				</Link>
			</section>
		</BaseContentWrapper>
	);
}
