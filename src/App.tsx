import "./App.css";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import { Menu } from "./components/layout/Menu.tsx";
import { AssistantPanel } from "./components/assistant/AssistantPanel.tsx";
import { CategoriesPage } from "./pages/categories/CategoriesPage.tsx";
import { SalesPage } from "./pages/sales/SalesPage.tsx";
import { UsersPage } from "./pages/users/UsersPage.tsx";
import { ProductsPage } from "./pages/products/ProductsPage.tsx";
import { LoginPage } from "./pages/login/LoginPage.tsx";

const AppLayout = () => (
  <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
    <Menu /> {/* O menu de navegação fica em todas as páginas internas */}
    <Box component="main" className="content" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 4 }, pb: { xs: 11, md: 12 } }}>
      <Outlet />
    </Box>
    <AssistantPanel />
  </Box>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Defina as rotas para cada módulo */}
        <Route element={<AppLayout />}>
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/sales" element={<SalesPage />} />
        </Route>
        {/* Adicione uma rota para a página inicial (se houver) */}
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
