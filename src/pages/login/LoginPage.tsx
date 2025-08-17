// src/pages/LoginPage.jsx
import { useNavigate } from "react-router-dom";
import { LoginForm } from "./components/LoginForm.tsx";
import { Box, Typography } from "@mui/material";

export const LoginPage = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    // Redireciona o usuário para a página de categorias após o login
    navigate("/categories");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "grey.100",
        p: 4,
      }}
    >
      <Box
        sx={{
          bgcolor: "white",
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          width: "100%",
          maxWidth: 400,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ textAlign: "center" }}
        >
          Login
        </Typography>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </Box>
    </Box>
  );
};
