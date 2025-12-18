import { Plus } from 'lucide-react'
import { useSelector } from 'react-redux'

const Dashboard = () => {
    const { profile } = useSelector((state) => state.auth)

    return (
        <div className='max-w-6xl mx-auto'>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1">
                        Welcome back, {profile?.full_name || 'User'}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Here's what's happening with your construction projects today
                    </p>
                </div>

                <button className="flex items-center gap-2 px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 transition">
                    <Plus size={16} /> New Project
                </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h3 className="text-gray-400 text-sm mb-2">Total Projects</h3>
                    <p className="text-3xl font-bold text-white">0</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h3 className="text-gray-400 text-sm mb-2">Active Projects</h3>
                    <p className="text-3xl font-bold text-white">0</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h3 className="text-gray-400 text-sm mb-2">Tasks Due</h3>
                    <p className="text-3xl font-bold text-white">0</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <h3 className="text-gray-400 text-sm mb-2">Team Members</h3>
                    <p className="text-3xl font-bold text-white">1</p>
                </div>
            </div>

            <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
                <p className="text-gray-400 mb-6">Get started by creating your first construction project</p>
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                    Create Your First Project
                </button>
            </div>
        </div>
    )
}

export default Dashboard
