// import { createContext, useContext, useEffect, useState } from 'react';
// import type { IUser } from '../assets/assets';
// import api from '../configs/api';
// import toast from 'react-hot-toast';

// interface AuthContextProps {
//     isLoggedIn: boolean;
//     setIsLoggedIn: (isLoggedIn: boolean) => void;
//     user: IUser | null;
//     setUser: (user: IUser | null) => void;
//     login: (user: { email: string; password: string }) => Promise<void>;
//     signUp: (user: { name: string; email: string; password: string }) => Promise<void>;
//     logout: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextProps>({
//     isLoggedIn: false,
//     setIsLoggedIn: () => {},
//     user: null,
//     setUser: () => {},
//     login: async () => {},
//     signUp: async () => {},
//     logout: async () => {},
// });

// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//     const [user, setUser] = useState<IUser | null>(null);
//     const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

//     const signUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
//         try {
//             const { data } = await api.post('/api/auth/register', { name, email, password });
//             if (data.user) {
//                 setUser(data.user as IUser);
//                 setIsLoggedIn(true);
//             }
//             toast.success(data.message);
//         } catch (error) {
//             console.log(error);
//         }
//     };

//     const login = async ({ email, password }: { email: string; password: string }) => {
//         try {
//             const { data } = await api.post('/api/auth/login', { email, password });
//             if (data.user) {
//                 setUser(data.user as IUser);
//                 setIsLoggedIn(true);
//             }
//             toast.success(data.message);
//         } catch (error) {
//             console.log(error);
//         }
//     };

//     const logout = async () => {
//         try {
//             const { data } = await api.post('/api/auth/logout');
//             setUser(null);
//             setIsLoggedIn(false);
//             toast.success(data.message);
//         } catch (error) {
//             console.log(error);
//         }
//     };

//     const fetchUser = async () => {
//         try {
//             const { data } = await api.get('/api/auth/verify');
//             if (data.user) {
//                 setUser(data.user as IUser);
//                 setIsLoggedIn(true);
//             }
//         } catch (error) {
//             console.log(error);
//         }
//     };

//     useEffect(() => {
//         (async () => {
//             await fetchUser();
//         })();
//     }, []);

//     const value = {
//         user,
//         setUser,
//         isLoggedIn,
//         setIsLoggedIn,
//         signUp,
//         login,
//         logout,
//     };

//     return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => useContext(AuthContext);
import { createContext, useContext, useEffect, useState } from 'react';
import type { IUser } from '../assets/assets';
import api from '../configs/api';
import toast from 'react-hot-toast';

interface AuthContextProps {
    isLoggedIn: boolean;
    user: IUser | null;
    login: (user: { email: string; password: string }) => Promise<void>;
    signUp: (user: { name: string; email: string; password: string }) => Promise<void>;
    loginWithGoogle: () => Promise<void>; // ✅ added
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    // 🆕 REGISTER
    const signUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
        try {
            const { data } = await api.post('/api/auth/register', { name, email, password });
            if (data.user) {
                setUser(data.user);
                setIsLoggedIn(true);
                toast.success(data.message);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Signup failed');
        }
    };

    // 🔐 LOGIN
    const login = async ({ email, password }: { email: string; password: string }) => {
        try {
            const { data } = await api.post('/api/auth/login', { email, password });
            if (data.user) {
                setUser(data.user);
                setIsLoggedIn(true);
                toast.success(data.message);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Login failed');
        }
    };

    // 🔵 GOOGLE LOGIN (BACKEND BASED)
    const loginWithGoogle = async () => {
        try {
            // 🔁 backend handles OAuth
            window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;
        } catch (error) {
            toast.error('Google login failed');
        }
    };

    // 🚪 LOGOUT
    const logout = async () => {
        try {
            await api.post('/api/auth/logout');
            setUser(null);
            setIsLoggedIn(false);
            toast.success('Logged out');
        } catch {
            toast.error('Logout failed');
        }
    };

    // 🔄 VERIFY USER (SESSION / COOKIE)
    const fetchUser = async () => {
        try {
            const { data } = await api.get('/api/auth/verify');
            if (data.user) {
                setUser(data.user);
                setIsLoggedIn(true);
            }
        } catch {
            setUser(null);
            setIsLoggedIn(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoggedIn,
                login,
                signUp,
                loginWithGoogle,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};

