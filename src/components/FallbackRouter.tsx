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

  // Encontra a rota que corresponde ao caminho atual
  const matchedRoute = routes.find(route => route.path === currentPath);

  if (matchedRoute) {
    const Component = matchedRoute.component;
    return <Component />;
  }

  // Se não encontrou rota e tem fallback, renderiza o fallback
  if (Fallback) {
    return <Fallback />;
  }

  // Caso contrário, renderiza uma página 404 simples
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-400">Página não encontrada</p>
      </div>
    </div>
  );
};

export default Router;
