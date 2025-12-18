import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { FolderOpenIcon, LayoutDashboardIcon, SettingsIcon, UsersIcon } from 'lucide-react'

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {

    const menuItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
        { name: 'Projects', href: '/projects', icon: FolderOpenIcon },
        { name: 'Team', href: '/team', icon: UsersIcon },
    ]

    const sidebarRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsSidebarOpen]);

    return (
        <div ref={sidebarRef} className={`z-10 bg-zinc-900 min-w-68 flex flex-col h-screen border-r border-zinc-800 max-sm:absolute transition-all ${isSidebarOpen ? 'left-0' : '-left-full'} `}>
            <div className="p-6 border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white">Construction Team</h2>
            </div>
            <div className='flex-1 overflow-y-scroll no-scrollbar flex flex-col'>
                <div className='p-4'>
                    {menuItems.map((item) => (
                        <NavLink
                            to={item.href}
                            key={item.name}
                            className={({ isActive }) => `flex items-center gap-3 py-2 px-4 text-zinc-100 cursor-pointer rounded transition-all ${isActive ? 'bg-zinc-800 ring-1 ring-zinc-700' : 'hover:bg-zinc-800/60'}`}
                        >
                            <item.icon size={16} />
                            <p className='text-sm truncate'>{item.name}</p>
                        </NavLink>
                    ))}
                    <button className='flex w-full items-center gap-3 py-2 px-4 text-zinc-100 cursor-pointer rounded hover:bg-zinc-800/60 transition-all'>
                        <SettingsIcon size={16} />
                        <p className='text-sm truncate'>Settings</p>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Sidebar
