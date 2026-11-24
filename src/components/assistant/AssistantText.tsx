import { Fragment } from "react";
import { Box, Typography } from "@mui/material";

const renderInline = (line: string) =>
  line.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );

export const AssistantText = ({ text }: { text: string }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
    {text.split("\n").map((rawLine, index) => {
      const line = rawLine.trimEnd();
      if (!line.trim()) return <Box key={index} sx={{ height: 4 }} />;
      const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
      const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
      if (bullet || numbered) {
        return (
          <Box key={index} sx={{ display: "flex", gap: 1, pl: 0.5 }}>
            <Typography variant="body2" component="span" sx={{ minWidth: 14, color: "text.secondary" }}>
              {numbered ? `${numbered[1]}.` : "•"}
            </Typography>
            <Typography variant="body2" component="span">
              {renderInline(numbered ? numbered[2] : bullet![1])}
            </Typography>
          </Box>
        );
      }
      const heading = line.match(/^#{1,6}\s+(.*)$/);
      return (
        <Typography key={index} variant="body2" sx={{ fontWeight: heading ? 700 : undefined }}>
          {renderInline(heading ? heading[1] : line)}
        </Typography>
      );
    })}
  </Box>
);
