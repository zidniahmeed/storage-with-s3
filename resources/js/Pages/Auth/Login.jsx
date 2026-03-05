import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            <Head title="Log in" />

            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center justify-center mb-4 transform transition-transform hover:scale-105">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11v6m0 0l-3-3m3 3l3-3" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Family Storage</h1>
                    <p className="mt-2 text-sm text-gray-500 font-medium">Your private cloud space</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-100/50 border border-white/50 p-8 sm:p-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Welcome back</h2>

                    {status && (
                        <div className="mb-6 p-4 rounded-xl bg-green-50/80 border border-green-100/50 text-sm font-semibold text-green-700 backdrop-blur-sm">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="email" value="Email" className="text-gray-700 font-bold mb-2 ml-1" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="block w-full rounded-2xl border-gray-200 bg-white/50 focus:bg-white focus:ring-indigo-500/20 focus:border-indigo-500 transition-all px-4 py-3"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="name@example.com"
                            />
                            <InputError message={errors.email} className="mt-2 ml-1" />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2 ml-1 mr-1">
                                <InputLabel htmlFor="password" value="Password" className="text-gray-700 font-bold" />
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                                    >
                                        Forgot?
                                    </Link>
                                )}
                            </div>
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="block w-full rounded-2xl border-gray-200 bg-white/50 focus:bg-white focus:ring-indigo-500/20 focus:border-indigo-500 transition-all px-4 py-3"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                            />
                            <InputError message={errors.password} className="mt-2 ml-1" />
                        </div>

                        <div className="flex items-center ml-1">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-5 h-5 transition-all group-hover:border-indigo-400"
                                    />
                                </div>
                                <span className="ms-3 text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                                    Remember me for 30 days
                                </span>
                            </label>
                        </div>

                        <PrimaryButton
                            className="w-full justify-center py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 focus:ring-indigo-500 focus:ring-offset-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={processing}
                        >
                            Log in to My Space
                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </PrimaryButton>
                    </form>
                </div>

                {/* Footer note */}
                <p className="mt-8 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Private Storage System &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
