import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexto/AuthContexto';
import { Layout } from './componentes/layout/Layout';
import { Login } from './paginas/auth/Login';
import { RecuperarPassword } from './paginas/auth/RecuperarPassword';
import { Dashboard } from './paginas/dashboard/Dashboard';
import { ListaAlumnos } from './paginas/alumnos/ListaAlumnos';
import { ListaDocentes } from './paginas/docentes/ListaDocentes';
import { ListaGrados } from './paginas/grados/ListaGrados';
import { ListaCursos } from './paginas/cursos/ListaCursos';
import { Horarios } from './paginas/horarios/Horarios';
import { TomarAsistencia } from './paginas/asistencia/TomarAsistencia';
import { RegistrarNotas } from './paginas/notas/RegistrarNotas';
import { ListaComunicados } from './paginas/comunicados/ListaComunicados';
import { ListaEventos } from './paginas/eventos/ListaEventos';
import { ListaPagos } from './paginas/pagos/ListaPagos';
import { Reportes } from './paginas/reportes/Reportes';
import { Configuracion } from './paginas/configuracion/Configuracion';
import { RutaProtegida } from './rutas/RutaProtegida';
import { useTema } from './tienda/tema';

const queryClient = new QueryClient();

function App() {
  const { modoOscuro } = useTema();

  React.useEffect(() => {
    if (modoOscuro) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [modoOscuro]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-password" element={<RecuperarPassword />} />

            <Route element={<RutaProtegida />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/alumnos" element={<ListaAlumnos />} />
                <Route path="/docentes" element={<ListaDocentes />} />
                <Route path="/grados" element={<ListaGrados />} />
                <Route path="/cursos" element={<ListaCursos />} />
                <Route path="/horarios" element={<Horarios />} />
                <Route path="/asistencia" element={<TomarAsistencia />} />
                <Route path="/notas" element={<RegistrarNotas />} />
                <Route path="/comunicados" element={<ListaComunicados />} />
                <Route path="/eventos" element={<ListaEventos />} />
                <Route path="/pagos" element={<ListaPagos />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/configuracion" element={<Configuracion />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
