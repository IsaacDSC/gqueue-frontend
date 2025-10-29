import React from 'react';
import { useRouter } from '../hooks/useRouter';

export interface Route {
  path: string;
  component: React.ComponentType;
}

interface RouterProps {
  routes: Route[];
  fallback?: React.ComponentType;
}

export const Router: React.FC<RouterProps> = ({ routes, fallback: Fallback }) => {
  const { currentPath } = useRouter();

  // Find the route that matches the current path
  const matchedRoute = routes.find(route => route.path === currentPath);

  if (matchedRoute) {
    const Component = matchedRoute.component;
    return <Component />;
  }

  // If no route was found and there's a fallback, render the fallback
  if (Fallback) {
    return <Fallback />;
  }

  // Otherwise, render a simple 404 page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-400">Page not found</p>
      </div>
    </div>
  );
};

export default Router;
