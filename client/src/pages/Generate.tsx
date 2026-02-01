
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { colorSchemes, type AspectRatio, type IThumbnail, type ThumbnailStyle } from '../assets/assets';
import SoftBackdrop from '../components/SoftBackdrop';
import AspectRatioSelector from '../components/AspectRatioSelector';
import StyleSelector from '../components/StyleSelector';
import ColorSchemeSelector from '../components/ColorSchemeSelector';
import PreviewPanel from '../components/PreviewPanel';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../configs/api';

const Generate = () => {
    const { id } = useParams();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    const [title, setTitle] = useState('');
    const [additionalDetails, setAdditionalDetails] = useState('');
    const [thumbnail, setThumbnail] = useState<IThumbnail | null>(null);
    const [loading, setLoading] = useState(false);

    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [colorSchemeId, setColorSchemeId] = useState<string>(colorSchemes[0].id);
    const [style, setStyle] = useState<ThumbnailStyle>('Bold & Graphic');
    const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);

    // ✅ LOGIN CHECK ONLY WHEN USER CLICKS GENERATE
    const handleGenerate = async () => {
        if (!isLoggedIn) {
            toast.error('Please login to generate thumbnails');
            navigate('/login');
            return;
        }

        if (!title.trim()) {
            toast.error('Title is required');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                title,
                prompt: additionalDetails,
                style,
                aspect_ratio: aspectRatio,
                color_scheme: colorSchemeId,
                text_overlay: true,
            };

            const { data } = await api.post('/api/thumbnail/generate', payload);

            if (data?.thumbnail) {
                navigate('/generate/' + data.thumbnail._id);
                toast.success(data.message);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    // ✅ FETCH THUMBNAIL ONLY IF LOGGED IN
    const fetchThumbnail = async () => {
        try {
            const { data } = await api.get(`/api/user/thumbnail/${id}`);
            setThumbnail(data.thumbnail);
            setLoading(!data.thumbnail?.image_url);

            setTitle(data.thumbnail.title);
            setAdditionalDetails(data.thumbnail.user_prompt);
            setColorSchemeId(data.thumbnail.color_scheme);
            setAspectRatio(data.thumbnail.aspect_ratio);
            setStyle(data.thumbnail.style);
        } catch (error: any) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isLoggedIn && id) {
            fetchThumbnail();
        }
    }, [id, isLoggedIn]);

    useEffect(() => {
        if (!id) {
            setThumbnail(null);
        }
    }, [pathname]);

    return (
        <>
            <SoftBackdrop />
            <div className="pt-24 min-h-screen">
                <main className="max-w-6xl mx-auto px-4 py-8 pb-28">
                    <div className="grid lg:grid-cols-[400px_1fr] gap-8">
                        <div className={`space-y-6 ${id && 'pointer-events-none'}`}>
                            <div className="p-6 rounded-2xl bg-white/8 border border-white/12 shadow-xl space-y-6">
                                <h2 className="text-xl font-bold text-zinc-100">Create Your Thumbnail</h2>

                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter title"
                                    className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/12"
                                />

                                <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
                                <StyleSelector value={style} onChange={setStyle} isOpen={styleDropdownOpen} setIsOpen={setStyleDropdownOpen} />
                                <ColorSchemeSelector value={colorSchemeId} onChange={setColorSchemeId} />

                                {!id && (
                                    <button
                                        onClick={handleGenerate}
                                        className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700"
                                    >
                                        {loading ? 'Generating...' : 'Generate Thumbnail'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <PreviewPanel thumbnail={thumbnail} isLoading={loading} aspectRatio={aspectRatio} />
                    </div>
                </main>
            </div>
        </>
    );
};

export default Generate;
