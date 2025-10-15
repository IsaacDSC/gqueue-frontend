import React, { useEffect } from 'react';
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

  // Debug logging
  useEffect(() => {
    console.log('Router - Current path:', currentPath);
    console.log('Router - Available routes:', routes.map(r => r.path));
  }, [currentPath, routes]);

  // Encontra a rota que corresponde ao caminho atual
  const matchedRoute = routes.find(route => {
    console.log(`Comparing route "${route.path}" with current path "${currentPath}"`);
    return route.path === currentPath;
  });

  console.log('Router - Matched route:', matchedRoute ? matchedRoute.path : 'No match');

  if (matchedRoute) {
    const Component = matchedRoute.component;
    console.log('Router - Rendering matched component');
    return <Component />;
  }

  // Se não encontrou rota e tem fallback, renderiza o fallback
  if (Fallback) {
    console.log('Router - Rendering fallback component');
    return <Fallback />;
  }

  // Caso contrário, renderiza uma página 404 simples
  console.log('Router - Rendering 404 page');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-400 mb-4">Página não encontrada</p>
        <p className="text-sm text-gray-500">Caminho atual: {currentPath}</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Rotas disponíveis:</p>
          <ul>
            {routes.map((route, index) => (
              <li key={index}>{route.path}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Router;
