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
import AdminUsersPage from '@/pages/admin-users/AdminUsersPage'
import AuditLogPage from '@/pages/audit-log/AuditLogPage'
import TrackingScriptsPage from '@/pages/tracking/TrackingScriptsPage'
import SeoRoutesPage from '@/pages/seo/SeoRoutesPage'
import PostsPage from '@/pages/posts/PostsPage'
import ValuationRequestsPage from '@/pages/inboxes/ValuationRequestsPage'
import WaitlistPage from '@/pages/inboxes/WaitlistPage'

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
      {
        path: '/blog',
        element: <PostsPage />,
      },
      {
        path: '/avaliacoes',
        element: <ValuationRequestsPage />,
      },
      {
        path: '/lista-espera',
        element: <WaitlistPage />,
      },
      {
        path: '/seo',
        element: <SeoRoutesPage />,
      },
      {
        path: '/tracking',
        element: <TrackingScriptsPage />,
      },
      {
        path: '/usuarios-admin',
        element: <AdminUsersPage />,
      },
      {
        path: '/auditoria',
        element: <AuditLogPage />,
      },
    ],
  },
], {
  basename: '/admin',
})
