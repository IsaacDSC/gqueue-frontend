import React from "react";
import { Link } from "../components/Link";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Bem-vindo ao GQueue</h1>
        <p className="text-gray-400 mb-8">
          Gerencie seus eventos e configure seu servidor
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Link
            to="/config"
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg text-white font-medium transition-colors text-center"
          >
            Configurar Servidor
          </Link>

          <Link
            to="/events"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition-colors text-center"
          >
            Eventos Registrados
          </Link>

          <Link
            to="/dashboard"
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-medium transition-colors text-center"
          >
            Dashboard
          </Link>

          <Link
            to="/metrics"
            className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg text-white font-medium transition-colors text-center"
          >
            Métricas
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
