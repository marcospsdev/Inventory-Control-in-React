import { InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

interface SearchFieldProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export const SearchField = ({ value, placeholder, onChange }: SearchFieldProps) => (
  <TextField
    size="small"
    placeholder={placeholder}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    sx={{ width: { xs: "100%", sm: 280 }, bgcolor: "background.paper" }}
    slotProps={{
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      },
    }}
  />
);
