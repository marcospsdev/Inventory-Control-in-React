import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyIcon from "@mui/icons-material/Key";
import { PageHeader } from "../../components/layout/PageHeader";
import {
  USER_PROFILES,
  profileOf,
  userService,
  type User,
  type UserFormData,
} from "../../services/userService";
import { initialsOf } from "../../lib/format";
import { ListPagination } from "../../components/common/ListPagination";
import { SearchField } from "../../components/common/SearchField";
import { useDebouncedValue, usePagination } from "../../hooks/usePagination";

const PAGE_SIZES = [5, 10, 25];

const EMPTY: UserFormData = { name: "", email: "", password: "", user_type_id: USER_PROFILES[2].id };

const AVATAR_COLORS = ["#4f46e5", "#0891b2", "#16a34a", "#ea580c", "#db2777", "#7c3aed", "#0d9488"];
const colorFor = (id: string) => AVATAR_COLORS[[...id].reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordDone, setPasswordDone] = useState(false);
  const [total, setTotal] = useState(0);
  const [countsByType, setCountsByType] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const { page, limit, setPage, changeLimit } = usePagination(PAGE_SIZES[1]);
  const debouncedSearch = useDebouncedValue(search.trim());

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userService.list({ page: page + 1, limit, search: debouncedSearch });
      if (result.data.length === 0 && page > 0) {
        setPage(Math.max(0, result.totalPages - 1));
        return;
      }
      setUsers(result.data);
      setTotal(result.total);
      setCountsByType(result.countsByType);
    } catch {
      setError("Não foi possível carregar os usuários. Apenas administradores têm acesso a esta tela.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, setPage]);

  useEffect(() => {
    load();
  }, [load]);

  const openForm = async (user: User | null) => {
    setFormError(null);
    if (!user) {
      setEditing(null);
      setForm(EMPTY);
      setFormOpen(true);
      return;
    }
    try {
      const detail = await userService.getById(user.id);
      setEditing(detail);
      setForm({ name: detail.name, email: detail.email, user_type_id: detail.user_type_id });
      setFormOpen(true);
    } catch {
      setError("Não foi possível carregar os dados do usuário.");
    }
  };

  const openPassword = (user: User) => {
    setPasswordUser(user);
    setNewPassword("");
    setPasswordError(null);
    setPasswordDone(false);
  };

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwordUser) return;
    setPasswordError(null);
    try {
      await userService.updatePassword(passwordUser.id, newPassword);
      setPasswordDone(true);
    } catch {
      setPasswordError("Não foi possível redefinir a senha.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) await userService.update(editing.id, form);
      else await userService.create(form);
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não foi possível salvar o usuário.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await userService.remove(toDelete.id);
      setToDelete(null);
      await load();
    } catch {
      setError("Não foi possível excluir o usuário.");
      setToDelete(null);
    }
  };

  const countBy = (id: string) => countsByType[id] ?? 0;

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle="Gerencie quem acessa o sistema e o perfil de permissão de cada um"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)} disabled={isLoading}>
            Novo usuário
          </Button>
        }
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
        {USER_PROFILES.map((profile) => (
          <Card key={profile.id} variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              {profile.label}
              {profile.label.endsWith("r") ? "es" : "s"}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
              {countBy(profile.id)}
            </Typography>
          </Card>
        ))}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <SearchField value={search} placeholder="Buscar por nome ou e-mail..." onChange={changeSearch} />
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuário</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Perfil</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {users.map((user) => {
                  const profile = profileOf(user.user_type_id);
                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: colorFor(user.id), width: 36, height: 36, fontSize: 14 }}>{initialsOf(user.name)}</Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip size="small" label={profile?.label ?? "—"} color={profile?.color ?? "default"} variant="outlined" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openForm(user)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Redefinir senha">
                          <IconButton size="small" onClick={() => openPassword(user)}>
                            <KeyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton size="small" color="error" onClick={() => setToDelete(user)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <ListPagination
              total={total}
              page={page}
              limit={limit}
              limitOptions={PAGE_SIZES}
              onPageChange={setPage}
              onLimitChange={changeLimit}
            />
          </TableContainer>
        )}
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            {!editing && (
              <TextField label="Senha" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            )}
            <TextField select label="Perfil" value={form.user_type_id} onChange={(e) => setForm({ ...form, user_type_id: e.target.value })} required>
              {USER_PROFILES.map((profile) => (
                <MenuItem key={profile.id} value={profile.id}>
                  {profile.label}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={!!passwordUser} onClose={() => setPasswordUser(null)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={handlePassword}>
          <DialogTitle sx={{ fontWeight: 700 }}>Redefinir senha</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
            <Typography variant="body2" color="text.secondary">
              Defina uma nova senha para <strong>{passwordUser?.name}</strong>.
            </Typography>
            {passwordError && <Alert severity="error">{passwordError}</Alert>}
            {passwordDone && <Alert severity="success">Senha redefinida com sucesso.</Alert>}
            <TextField label="Nova senha" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required slotProps={{ htmlInput: { minLength: 6 } }} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setPasswordUser(null)}>{passwordDone ? "Fechar" : "Cancelar"}</Button>
            {!passwordDone && (
              <Button type="submit" variant="contained" disabled={newPassword.length < 6}>
                Salvar senha
              </Button>
            )}
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Excluir usuário?</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir <strong>{toDelete?.name}</strong>? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
