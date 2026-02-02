import { Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './globals.css';
import LenisScroll from './components/LenisScroll';
import Generate from './pages/Generate';
import MyGeneration from './pages/MyGeneration';
import ContactSection from './sections/ContactSection';
import YtPreview from './pages/YtPreview';
import Login from './components/Login';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

export default function App() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <>
            <Toaster />
            <LenisScroll />
            <Navbar />
            <Routes>
                <Route path='/' element={<HomePage />} />
                <Route path='/generate' element={<Generate />} />
                <Route path='/generate/:id' element={<Generate />} />
                <Route path='/my-generation' element={<MyGeneration />} />
                <Route path='/contact-section' element={<ContactSection />} />
                <Route path='/preview' element={<YtPreview />} />
                <Route path='/login' element={<Login />} />
            </Routes>
            <Footer />
        </>
    );
}
