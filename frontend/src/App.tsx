import { GlobalStyles, StyledEngineProvider } from '@mui/material';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import AuthenticatedRoute from './components/Redirects/AuthenticatedRoute';
import UnauthenticatedRoute from './components/Redirects/UnauthenticatedRoute';
import AuthUserContext from './contexts/AuthUserContext';
import './i18n/i18n';
import './index.css';
import BaseLayout from './layouts/BaseLayout';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import MainDashboard from './pages/MainDashboard/MainDashboard';
import NotFound from './pages/NotFound/NotFound';
import { AppRoutePaths } from './types/types';

function App() {
	return (
		<StyledEngineProvider enableCssLayer>
			<GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
			<Toaster
				toastOptions={{
					classNames: {
						error: 'bg-red-900! text-white! border-red-500!',
						success: 'bg-green-900! text-white! border-green-500!',
						info: 'bg-blue-900! text-white! border-blue-500!',
						warning: 'bg-yellow-600! text-black! border-yellow-500!'
					}
				}}
			/>

			<AuthUserContext>
				<Router>
					<Routes>
						<Route
							path={AppRoutePaths.loginPage()}
							element={
								<UnauthenticatedRoute>
									<Login />
								</UnauthenticatedRoute>
							}
						/>

						<Route
							path={AppRoutePaths.mainDashboard()}
							element={
								<AuthenticatedRoute>
									<BaseLayout>
										<MainDashboard />
									</BaseLayout>
								</AuthenticatedRoute>
							}
						/>

						<Route
							path={AppRoutePaths.registerPage()}
							element={
								<UnauthenticatedRoute>
									<Register />
								</UnauthenticatedRoute>
							}
						/>

						<Route path="*" element={<NotFound />} />
					</Routes>
				</Router>
			</AuthUserContext>
		</StyledEngineProvider>
	);
}

export default App;
