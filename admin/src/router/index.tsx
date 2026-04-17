import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from './ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import SiteConfigPage from '@/pages/site-config/SiteConfigPage'
import BannersPage from '@/pages/banners/BannersPage'
import PagesListPage from '@/pages/pages/PagesListPage'
import PageEditorPage from '@/pages/pages/PageEditorPage'
import TestimonialsPage from '@/pages/testimonials/TestimonialsPage'
import LeadsPage from '@/pages/leads/LeadsPage'
import BrokersPage from '@/pages/brokers/BrokersPage'
import StatsPage from '@/pages/stats/StatsPage'
import HomeLayoutPage from '@/pages/home-layout/HomeLayoutPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/configuracoes',
        element: <SiteConfigPage />,
      },
      {
        path: '/banners',
        element: <BannersPage />,
      },
      {
        path: '/paginas',
        element: <PagesListPage />,
      },
      {
        path: '/paginas/:id',
        element: <PageEditorPage />,
      },
      {
        path: '/depoimentos',
        element: <TestimonialsPage />,
      },
      {
        path: '/leads',
        element: <LeadsPage />,
      },
      {
        path: '/corretores',
        element: <BrokersPage />,
      },
      {
        path: '/estatisticas',
        element: <StatsPage />,
      },
      {
        path: '/layout-home',
        element: <HomeLayoutPage />,
      },
    ],
  },
])
