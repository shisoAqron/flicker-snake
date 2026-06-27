import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 公開時はリポジトリ名に合わせて base を変更してください
// 例: base: "/flicker-snake/"
export default defineConfig({
  plugins: [react()],
  base: "/flicker-snake/",
});
