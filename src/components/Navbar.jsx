import { SearchIcon, PanelLeft, User } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../store/slices/authSlice'
import { useDispatch } from 'react-redux'

const Navbar = ({ setIsSidebarOpen }) => {
    const { profile } = useSelector(state => state.auth)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await dispatch(logout())
        navigate('/login')
    }

    return (
        <div className="w-full bg-zinc-900 border-b border-zinc-800 px-6 xl:px-16 py-3 flex-shrink-0">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                {/* Left section */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Sidebar Trigger */}
                    <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="sm:hidden p-2 rounded-lg transition-colors text-white hover:bg-zinc-800">
                        <PanelLeft size={20} />
                    </button>

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-sm">
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 size-3.5" />
                        <input
                            type="text"
                            placeholder="Search projects, tasks..."
                            className="pl-8 pr-4 py-2 w-full bg-black border border-zinc-700 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 hidden sm:block">{profile?.full_name}</span>
                    <div className="size-8 flex items-center justify-center bg-zinc-800 rounded-full">
                        <User className="size-4 text-white" />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-400 hover:text-white transition"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Navbar
