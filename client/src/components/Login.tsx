
import React, { useEffect, useState } from 'react';
import SoftBackdrop from './SoftBackdrop';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [state, setState] = useState<'login' | 'register'>('login');
    const { user, login, signUp, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (state === 'login') {
            login(formData);
        } else {
            signUp(formData);
        }
    };

    // ✅ Google login handler
    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            navigate('/');
        } catch (err) {
            console.error('Google login failed', err);
        }
    };

    // ✅ Redirect after login
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    return (
        <>
            <SoftBackdrop />
            <div className="min-h-screen flex items-center justify-center">
                <form
                    onSubmit={handleSubmit}
                    className="w-full sm:w-87.5 text-center bg-white/6 border border-white/10 rounded-2xl px-8"
                >
                    <h1 className="text-white text-3xl mt-10 font-medium">
                        {state === 'login' ? 'Login' : 'Sign up'}
                    </h1>

                    <p className="text-gray-400 text-sm mt-2">
                        Please sign in to continue
                    </p>

                    {/* Name (Register only) */}
                    {state === 'register' && (
                        <div className="flex items-center mt-6 w-full bg-white/5 ring-2 ring-white/10 focus-within:ring-pink-500/60 h-12 rounded-full pl-6 gap-2">
                            <input
                                type="text"
                                name="name"
                                placeholder="Name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-transparent text-white outline-none"
                                required
                            />
                        </div>
                    )}

                    {/* Email */}
                    <div className="flex items-center mt-4 w-full bg-white/5 ring-2 ring-white/10 focus-within:ring-pink-500/60 h-12 rounded-full pl-6 gap-2">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email id"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-transparent text-white outline-none"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="flex items-center mt-4 w-full bg-white/5 ring-2 ring-white/10 focus-within:ring-pink-500/60 h-12 rounded-full pl-6 gap-2">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-transparent text-white outline-none"
                            required
                        />
                    </div>

                    <div className="mt-4 text-left">
                        <button
                            type="button"
                            className="text-sm text-pink-400 hover:underline"
                        >
                            Forget password?
                        </button>
                    </div>

                    {/* Login / Signup button */}
                    <button
                        type="submit"
                        className="mt-3 w-full h-11 rounded-full text-white bg-pink-600 hover:bg-pink-500 transition"
                    >
                        {state === 'login' ? 'Login' : 'Sign up'}
                    </button>

                    {/* ✅ Google Login */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="mt-4 w-full h-11 rounded-full flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-200 transition"
                    >
                        <img
                            src="https://developers.google.com/identity/images/g-logo.png"
                            alt="Google"
                            className="w-5 h-5"
                        />
                        Sign in with Google
                    </button>

                    {/* Toggle */}
                    <p
                        onClick={() =>
                            setState(state === 'login' ? 'register' : 'login')
                        }
                        className="text-gray-400 text-sm mt-4 mb-10 cursor-pointer"
                    >
                        {state === 'login'
                            ? "Don't have an account?"
                            : 'Already have an account?'}
                        <span className="text-pink-400 hover:underline ml-1">
                            click here
                        </span>
                    </p>
                </form>
            </div>
        </>
    );
};

export default Login;


