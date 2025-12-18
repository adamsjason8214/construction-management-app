import { useState } from "react";
import { UsersIcon, Search, UserPlus, Shield, User } from "lucide-react";
import { useSelector } from "react-redux";
import InviteMemberDialog from "../components/dialogs/InviteMemberDialog";

const Team = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const { profile } = useSelector((state) => state.auth);

    // Mock data - will be replaced with real data from backend
    const users = [
        {
            id: 1,
            name: profile?.full_name || 'Admin User',
            email: profile?.email || 'admin@example.com',
            role: profile?.role || 'admin',
            avatar: null
        }
    ];

    const filteredUsers = users.filter(
        (user) =>
            user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-900 text-purple-200';
            case 'project_manager':
                return 'bg-blue-900 text-blue-200';
            case 'contractor':
                return 'bg-green-900 text-green-200';
            case 'worker':
                return 'bg-gray-800 text-gray-300';
            default:
                return 'bg-gray-800 text-gray-300';
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1">Team</h1>
                    <p className="text-gray-400 text-sm">
                        Manage team members and their roles
                    </p>
                </div>
                <button
                    onClick={() => setIsInviteOpen(true)}
                    className="flex items-center px-5 py-2 rounded text-sm bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-90 text-white transition"
                >
                    <UserPlus className="w-4 h-4 mr-2" /> Invite Member
                </button>
            </div>

            <InviteMemberDialog
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Members</p>
                            <p className="text-2xl font-bold text-white">{users.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <UsersIcon className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Active Projects</p>
                            <p className="text-2xl font-bold text-white">0</p>
                        </div>
                        <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Admins</p>
                            <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
                        </div>
                        <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-purple-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                    className="w-full pl-10 text-sm pr-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder-gray-400 focus:border-blue-500 outline-none"
                    placeholder="Search team members..."
                />
            </div>

            {/* Team Members List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-zinc-800 border-b border-zinc-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Member
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-zinc-800/50 transition">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mr-3">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="text-sm font-medium text-white">{user.name}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                        {user.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-blue-500 hover:text-blue-400 mr-4">Edit</button>
                                    <button className="text-red-500 hover:text-red-400">Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Team;
