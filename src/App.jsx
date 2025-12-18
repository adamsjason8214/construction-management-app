import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Toaster } from "react-hot-toast";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/TaskDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { checkSession } from "./store/slices/authSlice";

const App = () => {
    const dispatch = useDispatch();

    // Check for existing session on app load
    useEffect(() => {
        dispatch(checkSession());
    }, [dispatch]);

    return (
        <>
            <Toaster position="top-right" />
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="team" element={<Team />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="projects/:id" element={<ProjectDetails />} />
                    <Route path="projects/:id/tasks/:taskId" element={<TaskDetails />} />
                </Route>
            </Routes>
        </>
    );
};

export default App;
