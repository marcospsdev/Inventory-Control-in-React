import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Menu } from "./components/layout/Menu.tsx";
import { CategoriesPage } from "./pages/categories/CategoriesPage.tsx";
import { SalesPage } from "./pages/sales/SalesPage.tsx";
import { UsersPage } from "./pages/users/UsersPage.tsx";
import { ProductsPage } from "./pages/products/ProductsPage.tsx";
import { LoginPage } from "./pages/login/LoginPage.tsx";

function App() {
  return (
    <Router>
      <Menu /> {/* O menu de navegação fica em todas as páginas */}
      <div className="content">
        <Routes>
          {/* Defina as rotas para cada módulo */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/sales" element={<SalesPage />} />
          {/* Adicione uma rota para a página inicial (se houver) */}
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
