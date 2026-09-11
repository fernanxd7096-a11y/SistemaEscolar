import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/tienda/auth';
import { useRegistrarPush } from '@/hooks/useRegistrarPush';
import { useRol } from '@/hooks/useRol';
import { colores } from '@/utils/colores';

export default function AppLayout() {
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  const { esAdministrativo } = useRol();
  useRegistrarPush();

  if (!estaAutenticado) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerTintColor: colores.texto,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSecundario,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          headerTitle: 'Sistema Escolar SJT',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="asistencia"
        options={{
          title: 'Asistencia',
          headerTitle: 'Asistencia',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notas"
        options={{
          title: 'Notas',
          headerTitle: 'Notas',
          tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="comunicados"
        options={{
          title: 'Comunicados',
          headerTitle: 'Comunicados',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone-outline" size={size} color={color} />
          ),
        }}
      />
      {/*
        Gestión (alumnos, docentes y horario) solo existe para administrador y
        director. `Tabs.Protected` quita la ruta del árbol cuando el guard es
        falso, que es la forma correcta en expo-router 57: con `href` había que
        acertar el literal de la ruta tipada, y un valor que no calzara dejaba la
        pestaña sin renderizar aunque el rol fuera el correcto.
      */}
      <Tabs.Protected guard={esAdministrativo}>
        <Tabs.Screen
          name="gestion"
          options={{
            title: 'Gestión',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="briefcase-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs.Protected>
      {/*
        "Mi horario" no ocupa pestaña propia (ya son cinco): se abre desde el
        Inicio. `href: null` la mantiene navegable pero fuera de la barra.
      */}
      <Tabs.Screen name="horario" options={{ href: null, headerShown: false }} />
      {/*
        "perfil" ahora es una carpeta con su propio Stack (vista + edición), así
        que se apaga el header de la pestaña y cada pantalla del Stack pone el
        suyo — el mismo patrón que usa "gestion".
      */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
