import Lubelskie from '@/assets/images/partners/lubelskie.jpg';
import Mon from '@/assets/images/partners/mon.jpg';
import Pck from '@/assets/images/partners/pck.avif';
import Psp from '@/assets/images/partners/psp.png';
import Rcb from '@/assets/images/partners/rcb.jpg';
import RadarRender from '@/components/Animated/Radar/RadarBackground';
import ThreadsBackground from '@/components/Animated/Threads/ThreadsBackground';
import AppLogo from '@/components/icons/AppLogo/AppLogo';
import BaseContentWrapper from '@/components/Wrappers/BaseContentWrapper';
import { ALL_EMPLOYEES } from '@/data/employees';
import { AppRoutePaths } from '@/types/types';
import {
	AlertTriangle,
	ArrowRight,
	Briefcase,
	Building2,
	Handshake,
	Heart,
	Shield,
	Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MainDashboard() {
	return (
		<>
			<BaseContentWrapper className="px-8">
				<ThreadsBackground
					threadsProps={{
						distance: 0.2
					}}>
					{/* Hero */}
					<section className="text-center mb-20 gap-10 flex flex-col items-center">
						<AppLogo className="h-36" />
						<p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
							Innowacyjna platforma, która łączy świat profesjonalnego
							zatrudnienia z przestrzenią inicjatyw społecznych. Nasz program ma
							na celu ułatwienie pracodawcom znalezienia wykwalifikowanych
							pracowników ze wszystkich dziedzin. Użytkownicy w prosty sposób
							uzupełniają swoje dane, określają specjalizacje i dodają CV, aby
							zaprezentować się szerokiemu gronu rekruterów i instytucjom
							państwowym. Naszym głównym celem jest pomoc w sprawnym znalezieniu
							pracy, ale równie ważnym filarem naszej działalności jest
							promowanie i ułatwianie dostępu do wolontariatu.
						</p>
					</section>

					{/* CTA cards */}
					<section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-32 w-4/5 mx-auto">
						<Link
							to={AppRoutePaths.employees()}
							className="group rounded-2xl border border-base-border bg-white p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
							<div className="flex items-center gap-4 mb-5">
								<div className="h-14 w-14 rounded-xl bg-primary-blue/10 flex items-center justify-center shrink-0">
									<Briefcase size={28} className="text-primary-blue" />
								</div>
								<span className="text-3xl font-extrabold text-primary-blue">
									{ALL_EMPLOYEES.length.toLocaleString('pl-PL')}+
								</span>
							</div>
							<h2 className="text-2xl font-bold text-gray-600 mb-2">
								Pracownicy
							</h2>
							<p className="text-gray-600 mb-4">
								Przeglądaj kategorie zawodowe i znajdź wykwalifikowanych
								specjalistów spośród {ALL_EMPLOYEES.length} zarejestrowanych
								osób.
							</p>
							<span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-blue group-hover:gap-2.5 transition-all">
								Przeglądaj specjalistów <ArrowRight size={16} />
							</span>
						</Link>

						<Link
							to={AppRoutePaths.volunteers()}
							className="group rounded-2xl border border-base-border bg-white p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
							<div className="flex items-center gap-4 mb-5">
								<div className="h-14 w-14 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
									<Handshake size={28} className="text-rose-500" />
								</div>
								<span className="text-3xl font-extrabold text-rose-500">
									1 300+
								</span>
							</div>
							<h2 className="text-2xl font-bold text-gray-600 mb-2">
								Wolontariusze
							</h2>
							<p className="text-gray-600 mb-4">
								Dołącz do 1 300 wolontariuszy i pomagaj innym w lokalnych
								akcjach społecznych oraz sytuacjach kryzysowych.
							</p>
							<span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-500 group-hover:gap-2.5 transition-all">
								Dołącz do wolontariuszy <ArrowRight size={16} />
							</span>
						</Link>
					</section>
				</ThreadsBackground>

				{/* Partnerzy */}
				<section className="mb-32">
					<h2 className="text-4xl font-bold text-gray-600 mb-8 text-center">
						Partnerzy
					</h2>
					<div className="flex flex-wrap items-center justify-center gap-20">
						<img
							src={Mon}
							alt="Ministerstwo Obrony Narodowej"
							className="h-40 object-contain"
						/>
						<img
							src={Lubelskie}
							alt="Województwo Lubelskie"
							className="h-20 object-contain"
						/>
						<img
							src={Rcb}
							alt="Rządowe Centrum Bezpieczeństwa"
							className="h-30 object-contain"
						/>
						<img
							src={Psp}
							alt="Państwowa Straż Pożarna"
							className="h-30 object-contain"
						/>
						<img
							src={Pck}
							alt="Polski Czerwony Krzyż"
							className="h-30 object-contain"
						/>
					</div>
				</section>

				{/* Dla kogo */}
				<section className="mb-32">
					<h2 className="text-4xl font-bold text-gray-600 mb-8 text-center">
						Dla kogo przeznaczona jest aplikacja?
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
						<div className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
							<div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
								<Users size={20} className="text-blue-500" />
							</div>
							<h3 className="font-semibold text-gray-900 mb-1.5">
								Osoby prywatne
							</h3>
							<p className="text-sm text-gray-600">
								Poszukujące wykwalifikowanych fachowców do konkretnych zleceń
								lub szukające wolontariuszy do pomocy w lokalnych akcjach
								społecznych i wsparcia osób w potrzebie.
							</p>
						</div>

						<div className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
							<div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
								<Heart size={20} className="text-green-500" />
							</div>
							<h3 className="font-semibold text-gray-900 mb-1.5">
								Poszukujący pracy i wolontariusze
							</h3>
							<p className="text-sm text-gray-600">
								Kandydaci, którzy chcą znaleźć stałe zatrudnienie, dorywcze
								zlecenia lub pragną bezinteresownie zaangażować się w pomoc
								innym.
							</p>
						</div>

						<div className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
							<div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
								<Building2 size={20} className="text-violet-500" />
							</div>
							<h3 className="font-semibold text-gray-900 mb-1.5">
								Firmy i przedsiębiorstwa
							</h3>
							<p className="text-sm text-gray-600">
								Pracodawcy z sektora prywatnego, którzy chcą szybko i skutecznie
								zrekrutować wykwalifikowanych pracowników do swoich zespołów.
							</p>
						</div>

						<div className="rounded-xl border border-base-border bg-white p-6 shadow-sm">
							<div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
								<Shield size={20} className="text-amber-500" />
							</div>
							<h3 className="font-semibold text-gray-900 mb-1.5">
								Służby państwowe i NGO
							</h3>
							<p className="text-sm text-gray-600">
								Instytucje poszukujące osób w danym regionie w celu szybkiego
								pozyskania wsparcia logistycznego lub ludzkiego w sytuacjach
								kryzysowych.
							</p>
						</div>
					</div>
				</section>

				{/* Jak działa */}
				<section className="mb-32">
					<h2 className="text-4xl font-bold text-gray-600 mb-6 text-center">
						Jak aplikacja działa w praktyce?
					</h2>
					<div className="max-w-3xl mx-auto space-y-4">
						<div className="rounded-xl bg-gray-50 border border-base-border p-5">
							<h3 className="font-semibold text-gray-900 mb-1">
								Konto niezalogowane
							</h3>
							<p className="text-sm text-gray-600">
								Możesz przeglądać grupę fachowców i lokalizację. Dane osobowe, w
								tym imię i nazwisko, nie są dostępne. Lokalizacja ogranicza się
								do miasta/dzielnicy.
							</p>
						</div>
						<div className="rounded-xl bg-gray-50 border border-base-border p-5">
							<h3 className="font-semibold text-gray-900 mb-1">
								Użytkownik zalogowany
							</h3>
							<p className="text-sm text-gray-600">
								Ma dostęp do danych, na które użytkownicy wyrazili zgodę. Każde
								konto jest darmowe.
							</p>
						</div>
						<div className="rounded-xl bg-gray-50 border border-base-border p-5">
							<h3 className="font-semibold text-gray-900 mb-1">
								Firmy prywatne (zweryfikowane)
							</h3>
							<p className="text-sm text-gray-600">
								Muszą zostać zweryfikowane w celu zapewnienia bezpieczeństwa
								użytkownikom. W zamian mają dostęp do szerokiego zakresu danych.
								Użytkownik może nie wyrazić zgody na bycie widocznym dla
								pracodawców.
							</p>
						</div>
						<div className="rounded-xl bg-gray-50 border border-base-border p-5">
							<h3 className="font-semibold text-gray-900 mb-1">
								Organizacje państwowe (zweryfikowane)
							</h3>
							<p className="text-sm text-gray-600">
								Posiadają dostęp do dodatkowych informacji: uprawnienia (prawo
								jazdy, licencja pilota), kwalifikacje, posiadane środki
								transportu i inne dane umieszczone przez obywateli.
							</p>
						</div>
					</div>
				</section>
			</BaseContentWrapper>

			{/* Alerty — full viewport width with radar background */}
			<RadarRender className=" w-screen min-h-80">
				<div className="absolute inset-0 bg-gray-900/60 z-0" />
				<section className="relative z-10 max-w-3xl  px-8 py-16">
					<div className="flex items-center gap-3 mb-5">
						<AlertTriangle size={28} className="text-red-400" />
						<h2 className="text-3xl font-bold text-white">Alerty Open Hands</h2>
					</div>
					<p className="text-gray-200 leading-relaxed text-lg">
						Aplikacja posiada dedykowany system powiadomień regionalnych. W
						przypadku nagłej potrzeby, służby państwowe mogą opublikować pilne
						wezwanie o pomoc w konkretnej lokalizacji. Użytkownicy przebywający
						w okolicy, którzy wyrazili chęć udziału w akcjach kryzysowych,
						natychmiast otrzymują powiadomienie z informacją, gdzie i jakie
						wsparcie jest potrzebne. Po kliknięciu punktu na mapie użytkownik
						może wyrazić chęć udzielenia pomocy w punkcie wskazanym przez
						służby.
					</p>
				</section>
			</RadarRender>
		</>
	);
}
