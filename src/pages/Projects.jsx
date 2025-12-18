import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Plus, Search, FolderOpen } from "lucide-react";
import { fetchProjects } from "../store/slices/projectsSlice";

export default function Projects() {
    const dispatch = useDispatch();
    const { projects, loading } = useSelector((state) => state.projects);

    const [filteredProjects, setFilteredProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        status: "ALL",
    });

    useEffect(() => {
        dispatch(fetchProjects());
    }, [dispatch]);

    const filterProjects = () => {
        let filtered = projects;

        if (searchTerm) {
            filtered = filtered.filter(
                (project) =>
                    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filters.status !== "ALL") {
            filtered = filtered.filter((project) => project.status === filters.status);
        }

        setFilteredProjects(filtered);
    };

    useEffect(() => {
        filterProjects();
    }, [projects, searchTerm, filters]);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1">Projects</h1>
                    <p className="text-gray-400 text-sm">Manage and track your construction projects</p>
                </div>
                <button className="flex items-center px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 transition">
                    <Plus className="size-4 mr-2" /> New Project
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        onChange={(e) => setSearchTerm(e.target.value)}
                        value={searchTerm}
                        className="w-full pl-10 text-sm pr-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder-gray-400 focus:border-blue-500 outline-none"
                        placeholder="Search projects..."
                    />
                </div>
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-sm"
                >
                    <option value="ALL">All Status</option>
                    <option value="active">Active</option>
                    <option value="planning">Planning</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className="text-center py-16">
                    <p className="text-gray-400">Loading projects...</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-zinc-800 rounded-full flex items-center justify-center">
                        <FolderOpen className="w-12 h-12 text-zinc-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                        No projects found
                    </h3>
                    <p className="text-gray-400 mb-6 text-sm">
                        Create your first construction project to get started
                    </p>
                    <button className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mx-auto text-sm">
                        <Plus className="size-4" />
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <div key={project.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition">
                            <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
                            <p className="text-gray-400 text-sm mb-4">{project.description || 'No description'}</p>
                            <div className="flex items-center justify-between text-xs">
                                <span className="px-2 py-1 bg-zinc-800 text-gray-300 rounded capitalize">{project.status}</span>
                                <span className="text-gray-500">{project.location}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
